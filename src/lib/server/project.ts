import { PACKAGES, formatInr } from '@/shared/config/packages'
import { splitPayment } from '@/shared/config/payment-terms'
import { db, UNIQUE_VIOLATION } from './supabase'
import { fetchPayment, isSuccessfulPayment } from './razorpay'
import { notifyStudio, sendEmail } from './email'
import { PaymentNotVerified } from './consultation'

export type ProjectStatus = 'awaiting_advance' | 'in_production' | 'awaiting_balance' | 'completed' | 'cancelled' | 'refunded'
export type PaymentStage = 'advance' | 'balance'

export interface ProjectBookingRow {
  id: string
  project_reference: string
  client_name: string
  company_name: string
  email: string
  phone: string
  package_name: string
  package_price: number
  project_scope: string
  status: ProjectStatus
  advance_paid_at: string | null
  balance_paid_at: string | null
}

export interface ProjectPaymentRow {
  id: string
  booking_id: string
  stage: PaymentStage
  amount_paise: number
  razorpay_order_id: string
  razorpay_payment_id: string | null
  status: 'created' | 'paid' | 'failed' | 'refunded'
}

export async function bookingByReference(reference: string): Promise<ProjectBookingRow | null> {
  const { data, error } = await db().from('project_bookings').select('*').eq('project_reference', reference).maybeSingle()
  if (error) throw error
  return data as ProjectBookingRow | null
}

export interface PaymentPlan {
  priceInr: number
  advanceInr: number
  balanceInr: number
  /** What the client can pay right now, if anything. */
  due: { stage: PaymentStage; amountInr: number } | null
}

/**
 * Works out the advance/balance split and what is payable now — from the
 * database row and the packages config only, never from the browser.
 * Returns null if the booking's package doesn't match the config.
 */
export function paymentPlan(b: ProjectBookingRow): PaymentPlan | null {
  const pkg = PACKAGES.find((p) => p.name === b.package_name)
  if (!pkg || pkg.priceInr !== b.package_price) return null
  const { advance, balance } = splitPayment(pkg.priceInr)
  let due: PaymentPlan['due'] = null
  if (b.status === 'awaiting_advance' && !b.advance_paid_at) due = { stage: 'advance', amountInr: advance }
  if (b.status === 'awaiting_balance' && b.advance_paid_at && !b.balance_paid_at) due = { stage: 'balance', amountInr: balance }
  return { priceInr: pkg.priceInr, advanceInr: advance, balanceInr: balance, due }
}

export async function openPayment(bookingId: string, stage: PaymentStage, amountPaise: number): Promise<ProjectPaymentRow | null> {
  const { data, error } = await db()
    .from('project_payments')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('stage', stage)
    .eq('amount_paise', amountPaise)
    .eq('status', 'created')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as ProjectPaymentRow | null
}

/**
 * Confirms a project payment (advance or balance) after Razorpay confirms it
 * for this exact order and amount. Idempotent: safe to call from both the
 * browser's verify call and the webhook. Returns null if the order isn't a project payment.
 */
export async function confirmProjectPayment(
  orderId: string,
  paymentId: string,
): Promise<{ booking: ProjectBookingRow; stage: PaymentStage } | null> {
  const { data, error } = await db().from('project_payments').select('*').eq('razorpay_order_id', orderId).maybeSingle()
  if (error) throw error
  const payment = data as ProjectPaymentRow | null
  if (!payment) return null

  const loadBooking = async () => {
    const { data: b, error: e } = await db().from('project_bookings').select('*').eq('id', payment.booking_id).single()
    if (e) throw e
    return b as ProjectBookingRow
  }
  if (payment.status === 'paid') return { booking: await loadBooking(), stage: payment.stage }

  const rp = await fetchPayment(paymentId)
  if (!isSuccessfulPayment(rp, orderId, payment.amount_paise)) throw new PaymentNotVerified('Payment could not be verified.')

  const now = new Date().toISOString()
  const { data: marked, error: markErr } = await db()
    .from('project_payments')
    .update({ status: 'paid', razorpay_payment_id: paymentId, paid_at: now })
    .eq('id', payment.id)
    .neq('status', 'paid')
    .select('id')
    .maybeSingle()
  if (markErr?.code === UNIQUE_VIOLATION) {
    // This stage was already paid through another order. Keep a record and flag it.
    await notifyStudio(
      `ACTION NEEDED: duplicate ${payment.stage} payment`,
      `Order ${orderId} / payment ${paymentId} was paid, but this project's ${payment.stage} was already paid. Please review and refund the duplicate in Razorpay.`,
    )
    return { booking: await loadBooking(), stage: payment.stage }
  }
  if (markErr) throw markErr
  if (!marked) return { booking: await loadBooking(), stage: payment.stage } // another request got there first

  const bookingUpdate =
    payment.stage === 'advance'
      ? { status: 'in_production', advance_paid_at: now }
      : { status: 'completed', balance_paid_at: now }
  const { data: updated, error: upErr } = await db()
    .from('project_bookings')
    .update(bookingUpdate)
    .eq('id', payment.booking_id)
    .select('*')
    .single()
  if (upErr) throw upErr
  const booking = updated as ProjectBookingRow

  const paid = formatInr(payment.amount_paise / 100)
  const what = payment.stage === 'advance' ? 'advance' : 'balance'
  await sendEmail(
    booking.email,
    `${payment.stage === 'advance' ? 'Advance' : 'Balance'} payment received — ${booking.project_reference}`,
    [
      `Hi ${booking.client_name},`,
      '',
      `We've received your ${what} payment of ${paid} for ${booking.package_name} (reference ${booking.project_reference}).`,
      payment.stage === 'advance'
        ? 'Your project is confirmed. We will be in touch to begin work.'
        : 'Your project is now fully paid. Thank you for working with us.',
    ].join('\n'),
  )
  await notifyStudio(
    `Project ${what} received — ${booking.project_reference}`,
    `${booking.client_name} (${booking.company_name}) paid the ${what} of ${paid} for ${booking.package_name}.`,
  )
  return { booking, stage: payment.stage }
}

export async function markProjectPaymentFailed(orderId: string): Promise<void> {
  await db().from('project_payments').update({ status: 'failed' }).eq('razorpay_order_id', orderId).eq('status', 'created')
}
