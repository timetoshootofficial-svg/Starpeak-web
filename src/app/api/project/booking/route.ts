import { REFERENCE_RE } from '@/shared/validation'
import { paymentsConfigured } from '@/lib/server/env'
import { NOT_CONFIGURED, error, handle, json } from '@/lib/server/http'
import { amountDueInr, bookingByReference } from '@/lib/server/project'

/**
 * GET /api/project/booking?reference=SPP-XXXXXXXXXX
 * Returns what the client needs to review before paying. Email and phone are
 * deliberately left out; the reference itself is the private link.
 */
export const GET = handle(async (request) => {
  if (!paymentsConfigured()) return NOT_CONFIGURED()
  const reference = new URL(request.url).searchParams.get('reference') || ''
  if (!REFERENCE_RE.test(reference) || !reference.startsWith('SPP-')) return error('Not found.', 404)

  const b = await bookingByReference(reference)
  if (!b || b.status === 'cancelled') return error('Not found.', 404)

  const due = amountDueInr(b)
  if (!due) return error('This project is not ready for payment yet. Please contact us.', 409)

  return json({
    reference: b.project_reference,
    clientName: b.client_name,
    companyName: b.company_name,
    packageName: b.package_name,
    packagePriceInr: b.package_price,
    amountDueInr: due.amount,
    isAdvance: due.isAdvance,
    projectScope: b.project_scope,
    status: b.status,
    paymentStatus: b.payment_status,
  })
})

// Always run on demand (reads secrets and live data).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
