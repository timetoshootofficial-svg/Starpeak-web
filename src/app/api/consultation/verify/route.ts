import { env, paymentsConfigured } from '@/lib/server/env'
import { NOT_CONFIGURED, error, handle, json, readJson, sameOrigin } from '@/lib/server/http'
import { isRazorpayId, verifyPaymentSignature } from '@/lib/server/razorpay'
import { PaymentNotVerified, confirmConsultationPayment } from '@/lib/server/consultation'

/**
 * POST /api/consultation/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature } from Razorpay Checkout.
 * The booking is confirmed only if the signature is valid AND Razorpay reports
 * the payment as successful for this order and amount.
 */
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
    const result = await confirmConsultationPayment(orderId, paymentId)
    if (!result) return error('Booking not found for this payment.', 404)
    return json(result)
  } catch (err) {
    if (err instanceof PaymentNotVerified) {
      return error('Your payment has not been confirmed by the bank yet. Please wait a moment and refresh, or contact us.', 402, {
        code: 'payment_not_verified',
      })
    }
    throw err
  }
})

// Always run on demand (reads secrets and live data).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
