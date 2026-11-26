import { CONSULTATION } from '@/shared/config/consultation'
import { formatDateLong, formatTime12h } from '@/shared/slots'
import { db, UNIQUE_VIOLATION } from './supabase'
import { fetchPayment, isSuccessfulPayment } from './razorpay'
import { notifyStudio, sendEmail } from './email'

export const CONSULTATION_FEE_PAISE = CONSULTATION.feeInr * 100

export interface ConsultationRow {
  id: string
  booking_reference: string
  name: string
  email: string
  phone: string
  brand_name: string
  consultation_date: string
  consultation_time: string
  brief_description: string
  amount_paise: number
  payment_status: 'created' | 'paid' | 'failed'
  status: 'pending_payment' | 'confirmed' | 'expired' | 'cancelled' | 'needs_attention'
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  hold_expires_at: string
  confirmation_email_sent_at: string | null
}

export class PaymentNotVerified extends Error {}

/** Frees slots whose unpaid hold has run out, so they can be booked again. */
export async function releaseStaleHolds(date: string, time?: string): Promise<void> {
  let q = db()
    .from('consultation_bookings')
    .update({ status: 'expired' })
    .eq('consultation_date', date)
    .eq('status', 'pending_payment')
    .lt('hold_expires_at', new Date().toISOString())
  if (time) q = q.eq('consultation_time', time)
  const { error } = await q
  if (error) throw error
}

/** Times on `date` that are booked or held right now. Returns times only — never personal data. */
export async function unavailableTimes(date: string): Promise<string[]> {
  const nowIso = new Date().toISOString()
  const { data, error } = await db()
    .from('consultation_bookings')
    .select('consultation_time')
    .eq('consultation_date', date)
    .or(`status.eq.confirmed,and(status.eq.pending_payment,hold_expires_at.gt."${nowIso}")`)
  if (error) throw error
  return [...new Set((data || []).map((r) => r.consultation_time as string))]
}

export interface ConfirmationResult {
  reference: string
  date: string
  time: string
  status: 'confirmed' | 'needs_attention'
  emailSent: boolean
}

function toResult(row: ConsultationRow): ConfirmationResult {
  return {
    reference: row.booking_reference,
    date: row.consultation_date,
    time: row.consultation_time,
    status: row.status === 'needs_attention' ? 'needs_attention' : 'confirmed',
    emailSent: !!row.confirmation_email_sent_at,
  }
}

async function byOrder(orderId: string): Promise<ConsultationRow | null> {
  const { data, error } = await db().from('consultation_bookings').select('*').eq('razorpay_order_id', orderId).maybeSingle()
  if (error) throw error
  return data as ConsultationRow | null
}

/**
 * Marks a consultation as paid and confirmed — only after Razorpay confirms the
 * payment for this exact order and amount. Safe to call more than once (from
 * the browser's verify call and from the webhook): the first call wins and
 * later calls return the same result.
 */
export async function confirmConsultationPayment(orderId: string, paymentId: string): Promise<ConfirmationResult | null> {
  const booking = await byOrder(orderId)
  if (!booking) return null
  if (booking.payment_status === 'paid') return toResult(booking)

  const payment = await fetchPayment(paymentId)
  if (!isSuccessfulPayment(payment, orderId, booking.amount_paise)) {
    throw new PaymentNotVerified('Payment could not be verified.')
  }

  const paidFields = { payment_status: 'paid', razorpay_payment_id: paymentId, paid_at: new Date().toISOString() }
  let { data: updated, error } = await db()
    .from('consultation_bookings')
    .update({ ...paidFields, status: 'confirmed' })
    .eq('id', booking.id)
    .neq('payment_status', 'paid')
    .select('*')
    .maybeSingle()

  if (error?.code === UNIQUE_VIOLATION) {
    // The hold expired and someone else booked this slot meanwhile. Keep the
    // payment on record and flag the booking so the studio can reschedule.
    ;({ data: updated, error } = await db()
      .from('consultation_bookings')
      .update({ ...paidFields, status: 'needs_attention' })
      .eq('id', booking.id)
      .neq('payment_status', 'paid')
      .select('*')
      .maybeSingle())
  }
  if (error) throw error

  if (!updated) {
    // Another request confirmed it first.
    const latest = await byOrder(orderId)
    return latest ? toResult(latest) : null
  }

  const row = updated as ConsultationRow
  const emailed = await sendConfirmationEmail(row)
  if (emailed) {
    const sentAt = new Date().toISOString()
    await db().from('consultation_bookings').update({ confirmation_email_sent_at: sentAt }).eq('id', row.id)
    row.confirmation_email_sent_at = sentAt
  }
  await notifyStudio(
    `${row.status === 'confirmed' ? 'New consultation' : 'ACTION NEEDED: consultation slot conflict'} — ${row.booking_reference}`,
    [
      `Reference: ${row.booking_reference}`,
      `Status: ${row.status}`,
      `When: ${formatDateLong(row.consultation_date)}, ${formatTime12h(row.consultation_time)} IST`,
      `Name: ${row.name}`,
      `Brand: ${row.brand_name}`,
      `Email: ${row.email}`,
      `Phone: ${row.phone}`,
      '',
      row.brief_description,
    ].join('\n'),
  )
  return toResult(row)
}

function sendConfirmationEmail(row: ConsultationRow): Promise<boolean> {
  const when = `${formatDateLong(row.consultation_date)}, ${formatTime12h(row.consultation_time)} IST`
  const lines =
    row.status === 'confirmed'
      ? [
          `Hi ${row.name},`,
          '',
          'Your STARPEAK Media consultation is confirmed.',
          '',
          `Booking reference: ${row.booking_reference}`,
          `Date and time: ${when}`,
          `Fee paid: ₹${CONSULTATION.feeInr}`,
          '',
          "We'll contact you before the consultation with the call details.",
          '',
          CONSULTATION.refundNotice,
        ]
      : [
          `Hi ${row.name},`,
          '',
          `We received your payment of ₹${CONSULTATION.feeInr} (reference ${row.booking_reference}).`,
          `The time you chose (${when}) was taken while your payment was processing.`,
          "We'll contact you shortly to arrange another time.",
        ]
  return sendEmail(row.email, `Consultation ${row.status === 'confirmed' ? 'confirmed' : 'payment received'} — ${row.booking_reference}`, lines.join('\n'))
}

/** Records a failed payment attempt without touching bookings that are already paid. */
export async function markConsultationPaymentFailed(orderId: string): Promise<void> {
  await db()
    .from('consultation_bookings')
    .update({ payment_status: 'failed' })
    .eq('razorpay_order_id', orderId)
    .neq('payment_status', 'paid')
}
