import { env, paymentsConfigured } from '@/lib/server/env'
import { NOT_CONFIGURED, error, handle, json, readJson, sameOrigin } from '@/lib/server/http'
import { isRazorpayId, verifyPaymentSignature } from '@/lib/server/razorpay'
import { PaymentNotVerified } from '@/lib/server/consultation'
import { confirmProjectPayment } from '@/lib/server/project'

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

// Always run on demand (reads secrets and live data).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
