import { describe, expect, it } from 'vitest'
import { bookableDates, isBookableSlot, istDateString, istToInstant, openTimesFor } from '../shared/slots.js'
import { REFERENCE_RE, validateConsultation, validateProjectInquiry } from '../shared/validation.js'
import { CONSULTATION } from '../shared/config/consultation.js'
import { newReference } from '../api/_lib/reference.js'

// Wednesday 25 Nov 2026, 09:00 IST
const NOW = istToInstant('2026-11-25', '09:00')

describe('consultation slots', () => {
  it('uses India time for dates', () => {
    expect(istDateString(istToInstant('2026-11-25', '23:30'))).toBe('2026-11-25')
  })
  it('skips closed weekdays and stays inside the booking window', () => {
    const dates = bookableDates(NOW)
    expect(dates[0]).toBe('2026-11-25')
    expect(dates).not.toContain('2026-11-29') // Sunday
    expect(dates.length).toBeLessThanOrEqual(CONSULTATION.bookingWindowDays + 1)
  })
  it('applies minimum notice to today', () => {
    // 09:00 + 3h notice → 10:00 and 11:30 are too soon
    expect(openTimesFor('2026-11-25', NOW)).toEqual(['14:00', '16:00', '18:00'])
  })
  it('rejects past, closed, unknown or out-of-window slots', () => {
    expect(isBookableSlot('2026-11-26', '10:00', NOW)).toBe(true)
    expect(isBookableSlot('2026-11-25', '10:00', NOW)).toBe(false)
    expect(isBookableSlot('2026-11-29', '10:00', NOW)).toBe(false)
    expect(isBookableSlot('2026-11-26', '10:15', NOW)).toBe(false)
    expect(isBookableSlot('2027-01-30', '10:00', NOW)).toBe(false)
    expect(isBookableSlot('2026-02-30', '10:00', NOW)).toBe(false)
  })
})

describe('consultation form validation', () => {
  const valid = {
    name: 'Asha Kumar',
    email: 'asha@brand.in',
    phone: '+91 98765 43210',
    brandName: 'Asha Foods',
    date: '2026-11-26',
    time: '10:00',
    brief: 'Want to discuss an ad film for our new product.',
    acceptedPolicies: true,
  }
  it('accepts a complete booking and normalises the phone', () => {
    const r = validateConsultation(valid)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.phone).toBe('+919876543210')
  })
  it('flags every missing field', () => {
    const r = validateConsultation({})
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(
        ['acceptedPolicies', 'brandName', 'brief', 'date', 'email', 'name', 'phone', 'time'].sort(),
      )
    }
  })
  it('requires the refund policy to be accepted', () => {
    const r = validateConsultation({ ...valid, acceptedPolicies: false })
    expect(r.ok).toBe(false)
  })
})

describe('project inquiry validation', () => {
  it('requires a known package and timeline', () => {
    const r = validateProjectInquiry({
      name: 'Ravi',
      companyName: 'Ravi Motors',
      email: 'ravi@motors.in',
      phone: '9876543210',
      selectedPackage: 'Gold Package',
      projectDescription: 'A launch film for our new showroom opening next month.',
      preferredTimeline: 'Yesterday',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['preferredTimeline', 'selectedPackage'])
  })
})

describe('references', () => {
  it('are generated in the expected format', () => {
    for (let i = 0; i < 50; i++) {
      expect(newReference('SPC')).toMatch(REFERENCE_RE)
      expect(newReference('SPP')).toMatch(REFERENCE_RE)
    }
  })
})
