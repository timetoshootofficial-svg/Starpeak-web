/**
 * ₹99 paid consultation settings.
 *
 * The server uses `feeInr` when it creates the Razorpay order, so the amount
 * shown on the site and the amount charged always match. Edit the slot times,
 * booking window and closed days to suit your schedule.
 */
export const CONSULTATION = {
  feeInr: 99,
  /** Slot start times in 24-hour HH:MM, India Standard Time. */
  timeSlots: ['10:00', '11:30', '14:00', '16:00', '18:00'],
  /** How many days ahead people can book (today counts as day 0). */
  bookingWindowDays: 14,
  /** Weekdays with no consultations. 0 = Sunday … 6 = Saturday. */
  closedWeekdays: [0] as number[],
  /** A slot must start at least this many hours from now to be bookable. */
  minNoticeHours: 3,
  /** How long an unpaid booking holds its slot while the person pays. */
  holdMinutes: 15,
  refundNotice:
    'Consultation bookings are non-refundable once payment is completed, subject to applicable law.',
} as const
