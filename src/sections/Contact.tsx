'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPackage } from '@/shared/config/packages'
import { PACKAGE_CHOICES, TIMELINE_OPTIONS, validateProjectInquiry, type FieldErrors } from '@/shared/validation'
import { CONSULTATION } from '@/shared/config/consultation'
import { ApiError, api } from '@/lib/api'
import { SITE, isPlaceholder } from '@/config/site'
import { Honeypot, SelectField, TextArea, TextField } from '@/components/FormControls'

const EMPTY = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  selectedPackage: '',
  projectDescription: '',
  preferredTimeline: '',
}

export function Contact() {
  const params = useSearchParams()
  const [fields, setFields] = useState(EMPTY)
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sentRef, setSentRef] = useState<string | null>(null)

  // Pre-select the package when someone arrives from a pricing card.
  useEffect(() => {
    const pkg = getPackage(params?.get('package') || '')
    if (pkg) setFields((f) => ({ ...f, selectedPackage: pkg.name }))
  }, [params])

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setFields((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const result = validateProjectInquiry(fields)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSending(true)
    try {
      const res = await api.post<{ reference: string }>('/api/project/inquiry', { ...result.data, website: honeypot })
      setSentRef(res.reference)
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors)
      setFormError(
        err instanceof ApiError && (err.status === 400 || err.status === 422)
          ? err.message
          : `We couldn't send your inquiry right now. Please try again, or email us at ${SITE.contact.email}.`,
      )
    } finally {
      setSending(false)
    }
  }

  const igPlaceholder = isPlaceholder(SITE.contact.instagramHandle) || !SITE.contact.instagramUrl

  return (
    <section id="contact" aria-labelledby="contact-title" className="pb-20 sm:pb-34">
      <div className="container-page flex flex-col gap-14 border-t border-espresso/15 pt-16 sm:pt-24 lg:flex-row lg:gap-20">
        <div className="flex flex-col gap-6 lg:max-w-[420px] lg:flex-[1_1_300px]">
          <p className="eyebrow text-espresso/70">Contact</p>
          <h2 id="contact-title" className="heading-xl">Start a Project</h2>
          <p className="text-espresso/75">Tell us about your brand. We'll get in touch to discuss scope before anything is booked.</p>
          <dl className="mt-2 border-t border-espresso/15">
            <div className="flex justify-between gap-4 border-b border-espresso/15 py-4">
              <dt className="text-[13px] text-espresso/70">Email</dt>
              <dd className="text-[15px]">
                {isPlaceholder(SITE.contact.email) ? SITE.contact.email : <a className="link" href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a>}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-espresso/15 py-4">
              <dt className="text-[13px] text-espresso/70">Instagram</dt>
              <dd className="text-[15px]">
                {igPlaceholder ? SITE.contact.instagramHandle : (
                  <a className="link" href={SITE.contact.instagramUrl} target="_blank" rel="noopener noreferrer">{SITE.contact.instagramHandle}</a>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-espresso/15 py-4">
              <dt className="text-[13px] text-espresso/70">Project Inquiry</dt>
              <dd className="text-[15px]">Use the form</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-espresso/15 py-4">
              <dt className="text-[13px] text-espresso/70">Consultation</dt>
              <dd className="text-[15px]"><Link href="/#consultation" className="link">Book for ₹{CONSULTATION.feeInr}</Link></dd>
            </div>
          </dl>
        </div>

        <div className="lg:flex-[1.4_1_460px]">
          {sentRef ? (
            <div role="status" className="flex flex-col gap-4 rounded-2xl border border-espresso/15 p-8">
              <p className="eyebrow text-espresso/70">Inquiry received</p>
              <h3 className="font-display text-3xl font-semibold tracking-[-0.03em]">Thank you, {fields.name.split(' ')[0]}.</h3>
              <p className="text-espresso/85">
                We've received your project inquiry (reference <strong className="font-mono">{sentRef}</strong>). We'll contact you
                to discuss your brief.
              </p>
              <p className="text-sm text-espresso/75">
                This is not a confirmed booking. Your project is confirmed only after the scope, deliverables, timeline and
                payment terms are agreed with you in writing.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate aria-label="Project inquiry" className="relative flex flex-col gap-5">
              <Honeypot value={honeypot} onChange={setHoneypot} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Name" autoComplete="name" value={fields.name} onChange={set('name')} error={errors.name} />
                <TextField label="Company or Brand Name" autoComplete="organization" value={fields.companyName} onChange={set('companyName')} error={errors.companyName} />
                <TextField label="Email" type="email" autoComplete="email" value={fields.email} onChange={set('email')} error={errors.email} />
                <TextField label="Phone Number" type="tel" autoComplete="tel" placeholder="+91" value={fields.phone} onChange={set('phone')} error={errors.phone} />
                <SelectField label="Selected Package" options={PACKAGE_CHOICES} placeholder="Choose a package" value={fields.selectedPackage} onChange={set('selectedPackage')} error={errors.selectedPackage} />
                <SelectField label="Preferred Timeline" options={TIMELINE_OPTIONS} placeholder="Choose a timeline" value={fields.preferredTimeline} onChange={set('preferredTimeline')} error={errors.preferredTimeline} />
              </div>
              <TextArea
                label="Project Description"
                rows={5}
                placeholder="Your brand, the product or story, and what the film should achieve."
                value={fields.projectDescription}
                onChange={set('projectDescription')}
                error={errors.projectDescription}
              />
              <p className="text-[13px] text-espresso/75">
                This is an enquiry, not a confirmed booking. Scope, terms and payment are agreed with you before production.
                See our <Link href="/privacy-policy" className="link">Privacy Policy</Link> and{' '}
                <Link href="/refund-policy" className="link">Refund Policy</Link>.
              </p>
              {formError && <p role="alert" className="rounded-[10px] bg-espresso/5 p-3 text-sm font-medium">{formError}</p>}
              <div>
                <button type="submit" className="btn-dark min-h-13 px-8" disabled={sending}>
                  {sending ? 'Sending…' : 'Send Project Inquiry'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
