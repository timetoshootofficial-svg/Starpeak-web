/**
 * Razorpay Standard Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
 * The checkout script is loaded only when someone starts a payment.
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

export interface RazorpaySuccess {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayFailure {
  error?: { description?: string; reason?: string }
}

interface RazorpayInstance {
  open(): void
  on(event: 'payment.failed', handler: (resp: RazorpayFailure) => void): void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

let loading: Promise<void> | null = null

export function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loading = null
      reject(new Error('Could not load the payment window. Please check your connection and try again.'))
    }
    document.body.appendChild(script)
  })
  return loading
}

export type CheckoutOutcome =
  | { kind: 'success'; response: RazorpaySuccess }
  | { kind: 'dismissed' }
  | { kind: 'failed'; message: string }

interface CheckoutOptions {
  keyId: string
  orderId: string
  amountPaise: number
  description: string
  prefill: { name?: string; email?: string; contact?: string }
  notes?: Record<string, string>
}

/** Opens Razorpay checkout and resolves once the person pays, fails or closes it. */
export async function openCheckout(opts: CheckoutOptions): Promise<CheckoutOutcome> {
  await loadCheckout()
  const Razorpay = window.Razorpay
  if (!Razorpay) throw new Error('Payment window unavailable. Please try again.')

  return new Promise<CheckoutOutcome>((resolve) => {
    let settled = false
    const settle = (o: CheckoutOutcome) => {
      if (settled) return
      settled = true
      resolve(o)
    }
    let lastFailure = ''
    const rzp = new Razorpay({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amountPaise,
      currency: 'INR',
      name: 'STARPEAK Media',
      description: opts.description,
      image: `${window.location.origin}/apple-touch-icon.png`,
      prefill: opts.prefill,
      notes: opts.notes,
      theme: { color: '#2E0C01' },
      handler: (response: RazorpaySuccess) => settle({ kind: 'success', response }),
      modal: {
        ondismiss: () => settle(lastFailure ? { kind: 'failed', message: lastFailure } : { kind: 'dismissed' }),
      },
    })
    // Razorpay keeps the window open after a failed attempt so the person can retry;
    // we remember the reason and report it only if they close the window.
    rzp.on('payment.failed', (resp) => {
      lastFailure = resp.error?.description || 'The payment did not go through.'
    })
    rzp.open()
  })
}
