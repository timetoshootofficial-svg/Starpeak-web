import { REFERENCE_RE } from '@/shared/validation'
import { env, paymentsConfigured } from '@/lib/server/env'
import { NOT_CONFIGURED, error, handle, json, readJson, sameOrigin } from '@/lib/server/http'
import { db } from '@/lib/server/supabase'
import { createOrder } from '@/lib/server/razorpay'
import { amountDueInr, bookingByReference } from '@/lib/server/project'

/**
 * POST /api/project/create-order  { reference, acceptedTerms: true }
 * Only for projects the studio has approved (status "awaiting_payment").
 * The amount comes from the database row, checked against the packages config.
 */
export const POST = handle(async (request) => {
  if (!sameOrigin(request)) return error('Forbidden.', 403)
  if (!paymentsConfigured()) return NOT_CONFIGURED()

  const body = await readJson(request)
  const reference = typeof body.reference === 'string' ? body.reference : ''
  if (!REFERENCE_RE.test(reference) || !reference.startsWith('SPP-')) return error('Not found.', 404)
  if (body.acceptedTerms !== true) return error('Please accept the scope, terms and refund policy first.', 422)

  const b = await bookingByReference(reference)
  if (!b || b.status === 'cancelled') return error('Not found.', 404)
  if (b.payment_status === 'paid') return error('This project has already been paid.', 409, { code: 'already_paid' })
  if (b.status !== 'awaiting_payment') return error('This project is not open for payment. Please contact us.', 409)

  const due = amountDueInr(b)
  if (!due) return error('This project is not ready for payment yet. Please contact us.', 409)
  const amountPaise = due.amount * 100
  const keyId = env().razorpayKeyId

  // Reuse the open order for the same amount so one booking never has two live orders.
  if (b.razorpay_order_id && b.order_amount_paise === amountPaise && b.payment_status !== 'failed') {
    return json({ keyId, orderId: b.razorpay_order_id, amountPaise, currency: 'INR', reference })
  }

  const order = await createOrder(amountPaise, reference, { project_reference: reference, type: 'project' })
  const { error: updErr } = await db()
    .from('project_bookings')
    .update({
      razorpay_order_id: order.id,
      order_amount_paise: amountPaise,
      payment_status: 'order_created',
      terms_accepted_at: new Date().toISOString(),
    })
    .eq('id', b.id)
    .neq('payment_status', 'paid')
  if (updErr) throw updErr

  return json({ keyId, orderId: order.id, amountPaise, currency: 'INR', reference })
})

// Always run on demand (reads secrets and live data).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
