import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  isRazorpayId,
  isSuccessfulPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
  type RazorpayPayment,
} from '@/lib/server/razorpay'
import { amountDueInr, type ProjectBookingRow } from '@/lib/server/project'
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

describe('project amount due', () => {
  const row = (over: Partial<ProjectBookingRow>): ProjectBookingRow => ({
    id: '1',
    project_reference: 'SPP-ABCDEFGHJK',
    client_name: 'Test',
    company_name: 'Test Co',
    email: 't@example.com',
    phone: '+919999999999',
    package_name: 'Brand Story Film',
    package_price: 35000,
    amount_due: null,
    project_scope: 'Scope',
    payment_status: 'unpaid',
    status: 'awaiting_payment',
    razorpay_order_id: null,
    razorpay_payment_id: null,
    order_amount_paise: null,
    ...over,
  })
  it('uses the full package price when no advance is set', () => {
    expect(amountDueInr(row({}))).toEqual({ amount: 35000, isAdvance: false })
  })
  it('uses an agreed advance only when the studio set one', () => {
    expect(amountDueInr(row({ amount_due: 10000 }))).toEqual({ amount: 10000, isAdvance: true })
  })
  it('refuses prices that do not match the packages config', () => {
    expect(amountDueInr(row({ package_price: 30000 }))).toBeNull()
    expect(amountDueInr(row({ package_name: 'Made Up' }))).toBeNull()
    expect(amountDueInr(row({ amount_due: 99999 }))).toBeNull()
  })
})
