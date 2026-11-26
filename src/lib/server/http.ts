/** Small helpers for Web-standard (Request/Response) Vercel functions. */

const MAX_BODY_BYTES = 32 * 1024

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  })
}

export function error(message: string, status: number, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status)
}

export const NOT_CONFIGURED = () =>
  error('Online booking is not available yet. Please contact us directly.', 503, { code: 'not_configured' })

export class BadRequest extends Error {}

/** Parses a JSON object body with a size limit. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') || ''
  if (!type.includes('application/json')) throw new BadRequest('Expected a JSON request.')
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) throw new BadRequest('Request is too large.')
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    return parsed as Record<string, unknown>
  } catch {
    throw new BadRequest('Invalid JSON.')
  }
}

/** Wraps a handler so unexpected errors become a generic 500 without leaking details. */
export function handle(fn: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await fn(request)
    } catch (err) {
      if (err instanceof BadRequest) return error(err.message, 400)
      console.error('[api] unhandled error', err)
      return error('Something went wrong on our side. Please try again.', 500)
    }
  }
}

/** Rejects cross-site browser POSTs (simple CSRF guard). Server-to-server calls without Origin pass. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}
