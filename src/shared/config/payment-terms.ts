/**
 * Project payment terms, as set by STARPEAK Media.
 *
 * - A 50% advance confirms and starts the project.
 * - The remaining 50% (balance) is paid after final delivery.
 * - Before work starts, the advance is fully refundable on request.
 * - Once work starts, the advance is non-refundable. The balance is non-refundable once paid.
 *
 * The server uses ADVANCE_PERCENT to calculate amounts, so the site, the
 * payment page and Razorpay always agree. Legal pages read the text below.
 */
export const ADVANCE_PERCENT = 50

export const PAYMENT_TERMS = {
  summary: `${ADVANCE_PERCENT}% advance to start the project. The remaining ${100 - ADVANCE_PERCENT}% is paid after final delivery.`,
  workStarts:
    'Work on a project starts once the advance is received and we begin brand discovery, scriptwriting, a brand visit or production, whichever comes first.',
  advanceRefund: `If you cancel before work on your project starts, the ${ADVANCE_PERCENT}% advance is refunded in full. Once work has started, the advance is non-refundable.`,
  balanceRefund: 'The balance payment, made after final delivery, is non-refundable once paid.',
  /** Shown on the payment page before someone pays the advance. */
  beforeAdvance: `Full refund of the advance if you cancel before work starts. Once work has started, the advance is non-refundable.`,
  /** Shown on the payment page before someone pays the balance. */
  beforeBalance: 'The balance is paid after final delivery and is non-refundable once paid.',
} as const

/** Splits a package price into the advance and the balance (whole rupees). */
export function splitPayment(priceInr: number): { advance: number; balance: number } {
  const advance = Math.round((priceInr * ADVANCE_PERCENT) / 100)
  return { advance, balance: priceInr - advance }
}
