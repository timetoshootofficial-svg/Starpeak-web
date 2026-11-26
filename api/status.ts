import { paymentsConfigured, databaseConfigured } from './_lib/env.js'
import { json } from './_lib/http.js'

/** GET /api/status — tells the site whether online booking is switched on. No secrets. */
export function GET(): Response {
  return json({ payments: paymentsConfigured(), inquiries: databaseConfigured() })
}
