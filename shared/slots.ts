import { CONSULTATION } from './config/consultation.js'

/** India Standard Time is a fixed UTC+05:30 offset (no daylight saving). */
const IST_OFFSET_MS = 330 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** YYYY-MM-DD for the IST calendar day containing `instant`. */
export function istDateString(instant: Date): string {
  return new Date(instant.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
}

/** The UTC instant at which `date` (YYYY-MM-DD) `time` (HH:MM) IST begins. */
export function istToInstant(date: string, time: string): Date {
  return new Date(Date.parse(`${date}T${time}:00+05:30`))
}

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

export function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const d = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date
}

/** Dates (IST) that are open for booking, starting today. */
export function bookableDates(now: Date = new Date()): string[] {
  const today = istDateString(now)
  const start = Date.parse(`${today}T00:00:00Z`)
  const dates: string[] = []
  for (let i = 0; i <= CONSULTATION.bookingWindowDays; i++) {
    const date = new Date(start + i * DAY_MS).toISOString().slice(0, 10)
    if (CONSULTATION.closedWeekdays.includes(weekdayOf(date))) continue
    if (openTimesFor(date, now).length === 0) continue
    dates.push(date)
  }
  return dates
}

/** Slot times on `date` that are far enough in the future to book. */
export function openTimesFor(date: string, now: Date = new Date()): string[] {
  const earliest = now.getTime() + CONSULTATION.minNoticeHours * 60 * 60 * 1000
  return CONSULTATION.timeSlots.filter((t) => istToInstant(date, t).getTime() >= earliest)
}

/** Server-side check that a requested date and time can be booked right now. */
export function isBookableSlot(date: string, time: string, now: Date = new Date()): boolean {
  if (!isValidDateString(date)) return false
  if (!(CONSULTATION.timeSlots as readonly string[]).includes(time)) return false
  return bookableDates(now).includes(date) && openTimesFor(date, now).includes(time)
}

export function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatDateLong(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateParts(date: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${date}T00:00:00Z`)
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }),
    day: d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'UTC' }),
    month: d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }),
  }
}
