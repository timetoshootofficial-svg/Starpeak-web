import { PACKAGES } from '@/shared/config/packages'
import { db } from './supabase'
import { fetchPayment, isSuccessfulPayment } from './razorpay'
import { notifyStudio, sendEmail } from './email'
import { PaymentNotVerified } from './consultation'

export interface ProjectBookingRow {
  id: string
  project_reference: string
  client_name: string
  company_name: string
  email: string
  phone: string
  package_name: string
  package_price: number
  amount_due: number | null
  project_scope: string
  payment_status: 'unpaid' | 'order_created' | 'paid' | 'failed'
  status: 'awaiting_payment' | 'confirmed' | 'in_production' | 'completed' | 'cancelled'
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  order_amount_paise: number | null
}

export async function bookingByReference(reference: string): Promise<ProjectBookingRow | null> {
  const { data, error } = await db().from('project_bookings').select('*').eq('project_reference', reference).maybeSingle()
  if (error) throw error
  return data as ProjectBookingRow | null
}

/**
 * Works out what the client should pay, from the database row only.
 * The package name and price must match the packages config; an advance is
 * used only when the studio has set `amount_due` (the agreed amount).
 */
export function amountDueInr(b: ProjectBookingRow): { amount: number; isAdvance: boolean } | null {
  const pkg = PACKAGES.find((p) => p.name === b.package_name)
  if (!pkg || pkg.priceInr !== b.package_price) return null
  if (b.amount_due == null) return { amount: pkg.priceInr, isAdvance: false }
  if (!Number.isInteger(b.amount_due) || b.amount_due < 1 || b.amount_due > pkg.priceInr) return null
  return { amount: b.amount_due, isAdvance: b.amount_due < pkg.priceInr }
}

/** Confirms a project payment after Razorpay confirms it. Idempotent. */
export async function confirmProjectPayment(orderId: string, paymentId: string): Promise<ProjectBookingRow | null> {
  const { data, error } = await db().from('project_bookings').select('*').eq('razorpay_order_id', orderId).maybeSingle()
  if (error) throw error
  const booking = data as ProjectBookingRow | null
  if (!booking) return null
  if (booking.payment_status === 'paid') return booking
  if (!booking.order_amount_paise) throw new PaymentNotVerified('Payment could not be verified.')

  const payment = await fetchPayment(paymentId)
  if (!isSuccessfulPayment(payment, orderId, booking.order_amount_paise)) {
    throw new PaymentNotVerified('Payment could not be verified.')
  }

  const { data: updated, error: upErr } = await db()
    .from('project_bookings')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', booking.id)
    .neq('payment_status', 'paid')
    .select('*')
    .maybeSingle()
  if (upErr) throw upErr
  if (!updated) return bookingByReference(booking.project_reference)

  const row = updated as ProjectBookingRow
  const paid = `₹${(booking.order_amount_paise / 100).toLocaleString('en-IN')}`
  await sendEmail(
    row.email,
    `Payment received — ${row.project_reference}`,
    [
      `Hi ${row.client_name},`,
      '',
      `We've received your payment of ${paid} for ${row.package_name} (reference ${row.project_reference}).`,
      'Your project is confirmed. We will be in touch about the next steps.',
    ].join('\n'),
  )
  await notifyStudio(
    `Project payment received — ${row.project_reference}`,
    `${row.client_name} (${row.company_name}) paid ${paid} for ${row.package_name}.`,
  )
  return row
}

export async function markProjectPaymentFailed(orderId: string): Promise<void> {
  await db()
    .from('project_bookings')
    .update({ payment_status: 'failed' })
    .eq('razorpay_order_id', orderId)
    .neq('payment_status', 'paid')
}
