import { env, paymentsConfigured } from '../_lib/env.js'
import { NOT_CONFIGURED, error, handle, json, readJson, sameOrigin } from '../_lib/http.js'
import { isRazorpayId, verifyPaymentSignature } from '../_lib/razorpay.js'
import { PaymentNotVerified } from '../_lib/consultation.js'
import { confirmProjectPayment } from '../_lib/project.js'

/** POST /api/project/verify — confirms a project payment after signature + Razorpay checks. */
export const POST = handle(async (request) => {
  if (!sameOrigin(request)) return error('Forbidden.', 403)
  if (!paymentsConfigured()) return NOT_CONFIGURED()

  const body = await readJson(request)
  const orderId = body.razorpay_order_id
  const paymentId = body.razorpay_payment_id
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : ''
  if (!isRazorpayId(orderId, 'order_') || !isRazorpayId(paymentId, 'pay_')) return error('Invalid payment details.', 400)
  if (!verifyPaymentSignature(orderId, paymentId, signature, env().razorpayKeySecret)) {
    return error('We could not verify this payment.', 400, { code: 'invalid_signature' })
  }

  try {
    const row = await confirmProjectPayment(orderId, paymentId)
    if (!row) return error('Project not found for this payment.', 404)
    return json({ reference: row.project_reference, status: row.status, paymentStatus: row.payment_status })
  } catch (err) {
    if (err instanceof PaymentNotVerified) {
      return error('Your payment has not been confirmed by the bank yet. Please wait a moment and refresh, or contact us.', 402)
    }
    throw err
  }
})
