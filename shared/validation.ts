import { PACKAGES } from './config/packages.js'
import { CONSULTATION } from './config/consultation.js'
import { isValidDateString } from './slots.js'

export type FieldErrors = Record<string, string>
export type Result<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors }

export const TIMELINE_OPTIONS = ['Within 2 weeks', 'Within a month', '1–3 months', 'Flexible'] as const
export const NOT_SURE_PACKAGE = 'Not sure yet'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function checkName(v: string, errors: FieldErrors, field = 'name') {
  if (v.length < 2) errors[field] = 'Please enter your name.'
  else if (v.length > 100) errors[field] = 'Please keep this under 100 characters.'
}

function checkEmail(v: string, errors: FieldErrors) {
  if (!EMAIL_RE.test(v) || v.length > 254) errors.email = 'Please enter a valid email address.'
}

/** Accepts Indian and international numbers; stores digits with an optional leading +. */
export function normalisePhone(v: string): string {
  const trimmed = v.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/\D/g, '')
}

function checkPhone(v: string, errors: FieldErrors) {
  const digits = v.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) errors.phone = 'Please enter a valid phone number.'
}

function checkText(v: string, errors: FieldErrors, field: string, label: string, min: number, max: number) {
  if (v.length < min) errors[field] = `Please add a short ${label}.`
  else if (v.length > max) errors[field] = `Please keep this under ${max} characters.`
}

export interface ConsultationInput {
  name: string
  email: string
  phone: string
  brandName: string
  date: string
  time: string
  brief: string
  acceptedPolicies: boolean
}

export function validateConsultation(raw: Record<string, unknown>): Result<ConsultationInput> {
  const errors: FieldErrors = {}
  const data: ConsultationInput = {
    name: str(raw.name),
    email: str(raw.email).toLowerCase(),
    phone: normalisePhone(str(raw.phone)),
    brandName: str(raw.brandName),
    date: str(raw.date),
    time: str(raw.time),
    brief: str(raw.brief),
    acceptedPolicies: raw.acceptedPolicies === true,
  }
  checkName(data.name, errors)
  checkEmail(data.email, errors)
  checkPhone(data.phone, errors)
  if (data.brandName.length < 1) errors.brandName = 'Please enter your brand name.'
  else if (data.brandName.length > 120) errors.brandName = 'Please keep this under 120 characters.'
  if (!isValidDateString(data.date)) errors.date = 'Please choose a date.'
  if (!(CONSULTATION.timeSlots as readonly string[]).includes(data.time)) errors.time = 'Please choose a time.'
  checkText(data.brief, errors, 'brief', 'description', 10, 1500)
  if (!data.acceptedPolicies) errors.acceptedPolicies = 'Please confirm you have read the policies.'
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data }
}

export interface ProjectInquiryInput {
  name: string
  companyName: string
  email: string
  phone: string
  selectedPackage: string
  projectDescription: string
  preferredTimeline: string
}

export const PACKAGE_CHOICES = [...PACKAGES.map((p) => p.name), NOT_SURE_PACKAGE]

export function validateProjectInquiry(raw: Record<string, unknown>): Result<ProjectInquiryInput> {
  const errors: FieldErrors = {}
  const data: ProjectInquiryInput = {
    name: str(raw.name),
    companyName: str(raw.companyName),
    email: str(raw.email).toLowerCase(),
    phone: normalisePhone(str(raw.phone)),
    selectedPackage: str(raw.selectedPackage),
    projectDescription: str(raw.projectDescription),
    preferredTimeline: str(raw.preferredTimeline),
  }
  checkName(data.name, errors)
  if (data.companyName.length < 1) errors.companyName = 'Please enter your company or brand name.'
  else if (data.companyName.length > 120) errors.companyName = 'Please keep this under 120 characters.'
  checkEmail(data.email, errors)
  checkPhone(data.phone, errors)
  if (!PACKAGE_CHOICES.includes(data.selectedPackage)) errors.selectedPackage = 'Please choose a package.'
  checkText(data.projectDescription, errors, 'projectDescription', 'project description', 20, 3000)
  if (!(TIMELINE_OPTIONS as readonly string[]).includes(data.preferredTimeline))
    errors.preferredTimeline = 'Please choose a timeline.'
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data }
}

/** Booking references: prefix + 10 characters from an unambiguous alphabet. */
export const REFERENCE_RE = /^SP[CP]-[A-HJ-NP-Z2-9]{10}$/
