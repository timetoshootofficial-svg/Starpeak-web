import { validateProjectInquiry } from '../../shared/validation.js'
import { databaseConfigured } from '../_lib/env.js'
import { error, handle, json, readJson, sameOrigin } from '../_lib/http.js'
import { db } from '../_lib/supabase.js'
import { newReference } from '../_lib/reference.js'
import { notifyStudio } from '../_lib/email.js'

/**
 * POST /api/project/inquiry — stores a project inquiry. This is NOT a booking:
 * the studio follows up, agrees scope in writing, then creates a project booking.
 */
export const POST = handle(async (request) => {
  if (!sameOrigin(request)) return error('Forbidden.', 403)
  if (!databaseConfigured()) {
    return error('Online inquiries are not available yet. Please email us instead.', 503, { code: 'not_configured' })
  }

  const body = await readJson(request)
  if (typeof body.website === 'string' && body.website.trim() !== '') return error('Could not process this request.', 400)

  const result = validateProjectInquiry(body)
  if (!result.ok) return error('Please check the highlighted fields.', 422, { fieldErrors: result.errors })
  const input = result.data

  const reference = newReference('SPP').replace('SPP-', 'INQ-')
  const { error: insErr } = await db().from('project_inquiries').insert({
    inquiry_reference: reference,
    name: input.name,
    company_name: input.companyName,
    email: input.email,
    phone: input.phone,
    selected_package: input.selectedPackage,
    project_description: input.projectDescription,
    preferred_timeline: input.preferredTimeline,
    status: 'new',
  })
  if (insErr) throw insErr

  await notifyStudio(
    `New project inquiry — ${input.companyName} (${reference})`,
    [
      `Reference: ${reference}`,
      `Name: ${input.name}`,
      `Company/Brand: ${input.companyName}`,
      `Email: ${input.email}`,
      `Phone: ${input.phone}`,
      `Package: ${input.selectedPackage}`,
      `Timeline: ${input.preferredTimeline}`,
      '',
      input.projectDescription,
    ].join('\n'),
  )

  return json({ reference }, 201)
})
