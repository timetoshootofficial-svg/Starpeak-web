import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  isRazorpayId,
  isSuccessfulPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
  type RazorpayPayment,
} from '@/lib/server/razorpay'
import { paymentPlan, type ProjectBookingRow } from '@/lib/server/project'
import { splitPayment } from '@/shared/config/payment-terms'
import { CONSULTATION_FEE_PAISE } from '@/lib/server/consultation'

const SECRET = 'test_secret'

describe('checkout signature', () => {
  const order = 'order_ABC123def'
  const pay = 'pay_XYZ789ghi'
  const good = createHmac('sha256', SECRET).update(`${order}|${pay}`).digest('hex')

  it('accepts a correct signature', () => {
    expect(verifyPaymentSignature(order, pay, good, SECRET)).toBe(true)
  })
  it('rejects a tampered signature, swapped ids or a wrong secret', () => {
    expect(verifyPaymentSignature(order, pay, good.replace(/.$/, '0'), SECRET)).toBe(false)
    expect(verifyPaymentSignature(pay, order, good, SECRET)).toBe(false)
    expect(verifyPaymentSignature(order, pay, good, 'other')).toBe(false)
    expect(verifyPaymentSignature(order, pay, '', SECRET)).toBe(false)
  })
})

describe('webhook signature', () => {
  const body = JSON.stringify({ event: 'payment.captured' })
  const sig = createHmac('sha256', SECRET).update(body).digest('hex')
  it('accepts the exact raw body only', () => {
    expect(verifyWebhookSignature(body, sig, SECRET)).toBe(true)
    expect(verifyWebhookSignature(body + ' ', sig, SECRET)).toBe(false)
  })
})

describe('payment status checks', () => {
  const base: RazorpayPayment = { id: 'pay_1', order_id: 'order_1', amount: 9900, currency: 'INR', status: 'captured' }
  it('requires the right order, amount, currency and a successful status', () => {
    expect(isSuccessfulPayment(base, 'order_1', 9900)).toBe(true)
    expect(isSuccessfulPayment({ ...base, status: 'authorized' }, 'order_1', 9900)).toBe(true)
    expect(isSuccessfulPayment({ ...base, status: 'failed' }, 'order_1', 9900)).toBe(false)
    expect(isSuccessfulPayment({ ...base, amount: 100 }, 'order_1', 9900)).toBe(false)
    expect(isSuccessfulPayment(base, 'order_2', 9900)).toBe(false)
  })
  it('charges exactly ₹99 for a consultation', () => {
    expect(CONSULTATION_FEE_PAISE).toBe(9900)
  })
  it('validates Razorpay id shapes', () => {
    expect(isRazorpayId('order_Abc123XYZ', 'order_')).toBe(true)
    expect(isRazorpayId('pay_Abc123XYZ', 'order_')).toBe(false)
    expect(isRazorpayId('order_abc;drop', 'order_')).toBe(false)
  })
})

describe('project payment plan (50% advance, balance after delivery)', () => {
  const row = (over: Partial<ProjectBookingRow>): ProjectBookingRow => ({
    id: '1',
    project_reference: 'SPP-ABCDEFGHJK',
    client_name: 'Test',
    company_name: 'Test Co',
    email: 't@example.com',
    phone: '+919999999999',
    package_name: 'Brand Story Film',
    package_price: 35000,
    project_scope: 'Scope',
    status: 'awaiting_advance',
    advance_paid_at: null,
    balance_paid_at: null,
    ...over,
  })
  it('splits every package price into two halves that add up', () => {
    expect(splitPayment(20000)).toEqual({ advance: 10000, balance: 10000 })
    expect(splitPayment(35000)).toEqual({ advance: 17500, balance: 17500 })
    expect(splitPayment(49000)).toEqual({ advance: 24500, balance: 24500 })
  })
  it('asks for the advance first', () => {
    expect(paymentPlan(row({}))?.due).toEqual({ stage: 'advance', amountInr: 17500 })
  })
  it('asks for nothing while the project is in production', () => {
    expect(paymentPlan(row({ status: 'in_production', advance_paid_at: '2026-11-26' }))?.due).toBeNull()
  })
  it('asks for the balance only after the studio marks final delivery', () => {
    expect(paymentPlan(row({ status: 'awaiting_balance', advance_paid_at: '2026-11-26' }))?.due).toEqual({
      stage: 'balance',
      amountInr: 17500,
    })
    // Balance can never be requested if the advance was never paid.
    expect(paymentPlan(row({ status: 'awaiting_balance' }))?.due).toBeNull()
  })
  it('asks for nothing once fully paid, cancelled or refunded', () => {
    const paid = { advance_paid_at: '2026-11-26', balance_paid_at: '2026-12-20' }
    expect(paymentPlan(row({ status: 'completed', ...paid }))?.due).toBeNull()
    expect(paymentPlan(row({ status: 'cancelled' }))?.due).toBeNull()
    expect(paymentPlan(row({ status: 'refunded' }))?.due).toBeNull()
  })
  it('refuses prices that do not match the packages config', () => {
    expect(paymentPlan(row({ package_price: 30000 }))).toBeNull()
    expect(paymentPlan(row({ package_name: 'Made Up' }))).toBeNull()
  })
})
