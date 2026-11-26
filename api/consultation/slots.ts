import { isValidDateString } from '../../shared/slots.js'
import { paymentsConfigured } from '../_lib/env.js'
import { NOT_CONFIGURED, error, handle, json } from '../_lib/http.js'
import { unavailableTimes } from '../_lib/consultation.js'

/** GET /api/consultation/slots?date=YYYY-MM-DD → { unavailable: ["10:00", …] } */
export const GET = handle(async (request) => {
  if (!paymentsConfigured()) return NOT_CONFIGURED()
  const date = new URL(request.url).searchParams.get('date') || ''
  if (!isValidDateString(date)) return error('Invalid date.', 400)
  return json({ unavailable: await unavailableTimes(date) })
})
