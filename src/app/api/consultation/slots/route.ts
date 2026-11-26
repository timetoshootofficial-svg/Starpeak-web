import { isValidDateString } from '@/shared/slots'
import { paymentsConfigured } from '@/lib/server/env'
import { NOT_CONFIGURED, error, handle, json } from '@/lib/server/http'
import { unavailableTimes } from '@/lib/server/consultation'

/** GET /api/consultation/slots?date=YYYY-MM-DD → { unavailable: ["10:00", …] } */
export const GET = handle(async (request) => {
  if (!paymentsConfigured()) return NOT_CONFIGURED()
  const date = new URL(request.url).searchParams.get('date') || ''
  if (!isValidDateString(date)) return error('Invalid date.', 400)
  return json({ unavailable: await unavailableTimes(date) })
})

// Always run on demand (reads secrets and live data).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
