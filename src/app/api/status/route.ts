import { paymentsConfigured, databaseConfigured } from '@/lib/server/env'
import { json } from '@/lib/server/http'

/** GET /api/status — tells the site whether online booking is switched on. No secrets. */
export function GET(): Response {
  return json({ payments: paymentsConfigured(), inquiries: databaseConfigured() })
}

// Always run on demand (reads secrets and live data).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
