import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GET as status } from '@/app/api/status/route'
import { POST as createOrder } from '@/app/api/consultation/create-order/route'
import { POST as verify } from '@/app/api/consultation/verify/route'
import { POST as projectVerify } from '@/app/api/project/verify/route'
import { POST as webhook } from '@/app/api/razorpay/webhook/route'
import { POST as inquiry } from '@/app/api/project/inquiry/route'

const KEYS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
]

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://site.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function clearEnv() {
  for (const k of KEYS) delete process.env[k]
}

describe('when payments are not configured', () => {
  beforeEach(clearEnv)

  it('reports payments as off', async () => {
    const res = status()
    expect(await res.json()).toEqual({ payments: false, inquiries: false })
  })

  it('refuses to create orders or confirm anything', async () => {
    expect((await createOrder(post('/api/consultation/create-order', {}))).status).toBe(503)
    expect((await verify(post('/api/consultation/verify', {}))).status).toBe(503)
    expect((await inquiry(post('/api/project/inquiry', {}))).status).toBe(503)
  })
})

describe('with configuration (no database calls reached)', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key'
    process.env.RAZORPAY_KEY_SECRET = 'secret'
    process.env.RAZORPAY_WEBHOOK_SECRET = 'whsecret'
  })
  afterEach(clearEnv)

  it('rejects invalid booking details before touching the database', async () => {
    const res = await createOrder(post('/api/consultation/create-order', { name: 'A' }))
    expect(res.status).toBe(422)
    const body = (await res.json()) as { fieldErrors: Record<string, string> }
    expect(body.fieldErrors.email).toBeDefined()
  })

  it('rejects bot submissions caught by the honeypot', async () => {
    const res = await createOrder(post('/api/consultation/create-order', { website: 'spam' }))
    expect(res.status).toBe(400)
  })

  it('rejects cross-site requests', async () => {
    const res = await createOrder(post('/api/consultation/create-order', {}, { origin: 'https://evil.test' }))
    expect(res.status).toBe(403)
  })

  it('never confirms a payment with a bad signature', async () => {
    const body = { razorpay_order_id: 'order_TEST123', razorpay_payment_id: 'pay_TEST456', razorpay_signature: 'deadbeef' }
    const res = await verify(post('/api/consultation/verify', body))
    expect(res.status).toBe(400)
    expect(((await res.json()) as { code: string }).code).toBe('invalid_signature')
    expect((await projectVerify(post('/api/project/verify', body))).status).toBe(400)
  })

  it('rejects malformed payment ids', async () => {
    const res = await verify(post('/api/consultation/verify', { razorpay_order_id: 'x', razorpay_payment_id: 'y', razorpay_signature: 'z' }))
    expect(res.status).toBe(400)
  })

  it('rejects webhooks with a missing or wrong signature', async () => {
    const raw = JSON.stringify({ event: 'payment.captured' })
    expect((await webhook(post('/api/razorpay/webhook', raw))).status).toBe(400)
    const wrong = createHmac('sha256', 'not-the-secret').update(raw).digest('hex')
    expect((await webhook(post('/api/razorpay/webhook', raw, { 'x-razorpay-signature': wrong }))).status).toBe(400)
  })

  it('rejects non-JSON bodies', async () => {
    const req = new Request('https://site.test/api/consultation/create-order', { method: 'POST', body: 'hello' })
    expect((await createOrder(req)).status).toBe(400)
  })
})
