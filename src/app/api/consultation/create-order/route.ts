import { CONSULTATION } from '@/shared/config/consultation'
import { formatTime12h, isBookableSlot } from '@/shared/slots'
import { validateConsultation } from '@/shared/validation'
import { env, paymentsConfigured } from '@/lib/server/env'
import { NOT_CONFIGURED, error, handle, json, readJson, sameOrigin } from '@/lib/server/http'
import { db, UNIQUE_VIOLATION } from '@/lib/server/supabase'
import { createOrder } from '@/lib/server/razorpay'
import { newReference } from '@/lib/server/reference'
import { CONSULTATION_FEE_PAISE, releaseStaleHolds, type ConsultationRow } from '@/lib/server/consultation'

/**
 * POST /api/consultation/create-order
 * Validates the booking, holds the slot, and creates a Razorpay order for the
 * fixed consultation fee. The amount never comes from the browser.
 */
export const POST = handle(async (request) => {
  if (!sameOrigin(request)) return error('Forbidden.', 403)
  if (!paymentsConfigured()) return NOT_CONFIGURED()

  const body = await readJson(request)
  // Honeypot: real people never fill this hidden field.
  if (typeof body.website === 'string' && body.website.trim() !== '') return error('Could not process this request.', 400)

  const result = validateConsultation(body)
  if (!result.ok) return error('Please check the highlighted fields.', 422, { fieldErrors: result.errors })
  const input = result.data

  if (!isBookableSlot(input.date, input.time)) {
    return error('That time is no longer available. Please choose another slot.', 409, { code: 'slot_taken' })
  }

  await releaseStaleHolds(input.date, input.time)

  // Same person retrying the same slot while their hold is still active: reuse it.
  const { data: existing, error: findErr } = await db()
    .from('consultation_bookings')
    .select('*')
    .eq('consultation_date', input.date)
    .eq('consultation_time', input.time)
    .eq('status', 'pending_payment')
    .eq('email', input.email)
    .maybeSingle()
  if (findErr) throw findErr
  const keyId = env().razorpayKeyId
  if (existing) {
    const row = existing as ConsultationRow
    if (row.razorpay_order_id) {
      return json({ keyId, orderId: row.razorpay_order_id, amountPaise: row.amount_paise, currency: 'INR', reference: row.booking_reference })
    }
  }

  const reference = newReference('SPC')
  const holdExpires = new Date(Date.now() + CONSULTATION.holdMinutes * 60 * 1000).toISOString()
  const { data: inserted, error: insErr } = await db()
    .from('consultation_bookings')
    .insert({
      booking_reference: reference,
      name: input.name,
      email: input.email,
      phone: input.phone,
      brand_name: input.brandName,
      consultation_date: input.date,
      consultation_time: input.time,
      brief_description: input.brief,
      consultation_fee: CONSULTATION.feeInr,
      amount_paise: CONSULTATION_FEE_PAISE,
      payment_status: 'created',
      status: 'pending_payment',
      hold_expires_at: holdExpires,
      policies_accepted_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insErr?.code === UNIQUE_VIOLATION) {
    return error(`Sorry, ${formatTime12h(input.time)} was just booked by someone else. Please choose another time.`, 409, {
      code: 'slot_taken',
    })
  }
  if (insErr) throw insErr

  let order
  try {
    order = await createOrder(CONSULTATION_FEE_PAISE, reference, { booking_reference: reference, type: 'consultation' })
  } catch (err) {
    // Release the slot if the order could not be created.
    await db().from('consultation_bookings').update({ status: 'cancelled' }).eq('id', inserted.id)
    throw err
  }

  const { error: updErr } = await db()
    .from('consultation_bookings')
    .update({ razorpay_order_id: order.id })
    .eq('id', inserted.id)
  if (updErr) throw updErr

  return json({ keyId, orderId: order.id, amountPaise: order.amount, currency: 'INR', reference })
})

// Always run on demand (reads secrets and live data).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
