import { env, paymentsConfigured } from '../_lib/env.js'
import { error, json } from '../_lib/http.js'
import { db, UNIQUE_VIOLATION } from '../_lib/supabase.js'
import { isRazorpayId, verifyWebhookSignature } from '../_lib/razorpay.js'
import { PaymentNotVerified, confirmConsultationPayment, markConsultationPaymentFailed } from '../_lib/consultation.js'
import { confirmProjectPayment, markProjectPaymentFailed } from '../_lib/project.js'

/**
 * POST /api/razorpay/webhook
 * Set this URL in Razorpay Dashboard → Webhooks with events:
 * payment.authorized, payment.captured, payment.failed, order.paid.
 *
 * This is the safety net for when someone pays but closes the browser before
 * the site can verify. Every event is signature-checked and recorded once.
 */
export async function POST(request: Request): Promise<Response> {
  if (!paymentsConfigured() || !env().razorpayWebhookSecret) return error('Not configured.', 503)

  const raw = await request.text()
  const signature = request.headers.get('x-razorpay-signature') || ''
  if (!verifyWebhookSignature(raw, signature, env().razorpayWebhookSecret)) return error('Invalid signature.', 400)

  let event: {
    event?: string
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } }
  }
  try {
    event = JSON.parse(raw)
  } catch {
    return error('Invalid JSON.', 400)
  }

  const eventId = request.headers.get('x-razorpay-event-id') || ''
  const name = event.event || ''
  const payment = event.payload?.payment?.entity
  const orderId = payment?.order_id
  const paymentId = payment?.id

  // Record the event once; a repeat delivery is acknowledged without reprocessing.
  if (eventId) {
    const { error: logErr } = await db()
      .from('payment_events')
      .insert({ event_id: eventId, event: name, razorpay_order_id: orderId ?? null, razorpay_payment_id: paymentId ?? null, payload: event })
    if (logErr?.code === UNIQUE_VIOLATION) return json({ ok: true, duplicate: true })
    if (logErr) console.error('[webhook] could not log event', logErr)
  }

  if (!isRazorpayId(orderId, 'order_')) return json({ ok: true, ignored: true })

  try {
    if (name === 'payment.captured' || name === 'payment.authorized' || name === 'order.paid') {
      if (!isRazorpayId(paymentId, 'pay_')) return json({ ok: true, ignored: true })
      const consultation = await confirmConsultationPayment(orderId, paymentId)
      if (!consultation) await confirmProjectPayment(orderId, paymentId)
    } else if (name === 'payment.failed') {
      await markConsultationPaymentFailed(orderId)
      await markProjectPaymentFailed(orderId)
    }
  } catch (err) {
    if (err instanceof PaymentNotVerified) return json({ ok: true, unverified: true })
    console.error('[webhook] processing failed', err)
    // 500 makes Razorpay retry the delivery later.
    return error('Processing failed.', 500)
  }

  return json({ ok: true })
}
