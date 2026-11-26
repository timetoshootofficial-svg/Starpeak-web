import { REFERENCE_RE } from '@/shared/validation'
import { env, paymentsConfigured } from '@/lib/server/env'
import { NOT_CONFIGURED, error, handle, json, readJson, sameOrigin } from '@/lib/server/http'
import { db } from '@/lib/server/supabase'
import { createOrder } from '@/lib/server/razorpay'
import { bookingByReference, openPayment, paymentPlan } from '@/lib/server/project'

/**
 * POST /api/project/create-order  { reference, acceptedTerms: true }
 * Creates a Razorpay order for whatever is due now: the 50% advance (for a
 * new project) or the balance (after the studio marks final delivery done).
 * The amount comes from the database row and the packages config only.
 */
export const POST = handle(async (request) => {
  if (!sameOrigin(request)) return error('Forbidden.', 403)
  if (!paymentsConfigured()) return NOT_CONFIGURED()

  const body = await readJson(request)
  const reference = typeof body.reference === 'string' ? body.reference : ''
  if (!REFERENCE_RE.test(reference) || !reference.startsWith('SPP-')) return error('Not found.', 404)
  if (body.acceptedTerms !== true) return error('Please accept the scope, terms and refund policy first.', 422)

  const b = await bookingByReference(reference)
  if (!b) return error('Not found.', 404)
  const plan = paymentPlan(b)
  if (!plan) return error('This project is not ready for payment yet. Please contact us.', 409)
  if (!plan.due) return error('There is nothing to pay on this project right now.', 409, { code: 'nothing_due' })

  const { stage, amountInr } = plan.due
  const amountPaise = amountInr * 100
  const keyId = env().razorpayKeyId

  // Reuse an open order for the same stage and amount, so one stage never has two live orders.
  const existing = await openPayment(b.id, stage, amountPaise)
  if (existing) {
    return json({ keyId, orderId: existing.razorpay_order_id, amountPaise, currency: 'INR', reference, stage })
  }

  const order = await createOrder(amountPaise, `${reference}-${stage}`, { project_reference: reference, stage, type: 'project' })
  const { error: insErr } = await db().from('project_payments').insert({
    booking_id: b.id,
    stage,
    amount_paise: amountPaise,
    razorpay_order_id: order.id,
    status: 'created',
  })
  if (insErr) throw insErr
  if (stage === 'advance') {
    await db().from('project_bookings').update({ terms_accepted_at: new Date().toISOString() }).eq('id', b.id)
  }

  return json({ keyId, orderId: order.id, amountPaise, currency: 'INR', reference, stage })
})

// Always run on demand (reads secrets and live data).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
