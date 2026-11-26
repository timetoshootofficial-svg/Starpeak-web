/** Thin wrapper around the site's own /api endpoints. */

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string>
  constructor(message: string, status: number, code?: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    })
  } catch {
    throw new ApiError('Could not reach the server. Please check your connection and try again.', 0, 'network')
  }
  let body: Record<string, unknown> = {}
  try {
    body = await res.json()
  } catch {
    // Non-JSON response (for example, the API isn't running in local UI-only dev).
  }
  if (!res.ok) {
    throw new ApiError(
      typeof body.error === 'string' ? body.error : 'Something went wrong. Please try again.',
      res.status,
      typeof body.code === 'string' ? body.code : undefined,
      body.fieldErrors as Record<string, string> | undefined,
    )
  }
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
}

/** Response types shared with the serverless functions. */
export interface OrderResponse {
  keyId: string
  orderId: string
  amountPaise: number
  currency: 'INR'
  reference: string
}

export interface ConsultationConfirmation {
  reference: string
  date: string
  time: string
  status: 'confirmed' | 'needs_attention'
  emailSent: boolean
}
