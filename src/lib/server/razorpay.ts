import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from './env'

/**
 * Razorpay Orders and Payments REST API (https://razorpay.com/docs/api/).
 * Orders are always created here on the server with an amount the server
 * decides — never an amount sent by the browser.
 */

const API = 'https://api.razorpay.com/v1'

function authHeader(): string {
  const e = env()
  return 'Basic ' + Buffer.from(`${e.razorpayKeyId}:${e.razorpayKeySecret}`).toString('base64')
}

export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
}

export interface RazorpayPayment {
  id: string
  order_id: string
  amount: number
  currency: string
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed'
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const desc = (body as { error?: { description?: string } }).error?.description
    throw new Error(`Razorpay ${path} failed (${res.status}): ${desc || 'unknown error'}`)
  }
  return body as T
}

export function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>): Promise<RazorpayOrder> {
  if (!Number.isInteger(amountPaise) || amountPaise < 100) throw new Error('Invalid order amount')
  return call<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: receipt.slice(0, 40), notes }),
  })
}

export function fetchPayment(paymentId: string): Promise<RazorpayPayment> {
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`)
}

function safeEqualHex(expected: string, received: string): boolean {
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(received, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Checkout signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex')
  return safeEqualHex(expected, signature)
}

/** Webhook signature: HMAC-SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!rawBody || !signature || !secret) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqualHex(expected, signature)
}

/** A payment counts as paid once Razorpay reports it authorized or captured for the right order and amount. */
export function isSuccessfulPayment(p: RazorpayPayment, orderId: string, amountPaise: number): boolean {
  return (
    p.order_id === orderId &&
    p.amount === amountPaise &&
    p.currency === 'INR' &&
    (p.status === 'captured' || p.status === 'authorized')
  )
}

const ID_RE = /^[A-Za-z0-9_]{6,64}$/
export function isRazorpayId(v: unknown, prefix: 'order_' | 'pay_'): v is string {
  return typeof v === 'string' && v.startsWith(prefix) && ID_RE.test(v)
}
