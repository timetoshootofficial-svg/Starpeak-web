'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { formatInr } from '@/shared/config/packages'
import { ADVANCE_PERCENT, PAYMENT_TERMS } from '@/shared/config/payment-terms'
import { REFERENCE_RE } from '@/shared/validation'
import { ApiError, api, type OrderResponse } from '@/lib/api'
import { openCheckout } from '@/lib/razorpay'
import { SITE } from '@/config/site'

type Stage = 'advance' | 'balance'

interface ProjectBooking {
  reference: string
  clientName: string
  companyName: string
  packageName: string
  packagePriceInr: number
  advanceInr: number
  balanceInr: number
  advancePaid: boolean
  balancePaid: boolean
  due: { stage: Stage; amountInr: number } | null
  projectScope: string
  status: 'awaiting_advance' | 'in_production' | 'awaiting_balance' | 'completed' | 'cancelled' | 'refunded'
}

type View =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; booking: ProjectBooking; notice?: string }
  | { kind: 'working'; booking: ProjectBooking; label: string }
  | { kind: 'justPaid'; booking: ProjectBooking; stage: Stage }

const STATUS_TEXT: Record<ProjectBooking['status'], string> = {
  awaiting_advance: 'Waiting for the advance payment',
  in_production: 'Advance received — your project is in progress',
  awaiting_balance: 'Final delivery done — balance payment due',
  completed: 'Fully paid — thank you',
  cancelled: 'This project has been cancelled',
  refunded: 'This project has been refunded',
}

/**
 * Private payment page for an approved project: /pay/SPP-XXXXXXXXXX.
 * Step 1: the client pays the 50% advance. Step 2: after final delivery,
 * the studio marks the balance as due and the client pays it from the same link.
 */
export function ProjectPayment() {
  const params = useParams<{ reference: string }>()
  const reference = decodeURIComponent(String(params?.reference ?? ''))
  const [view, setView] = useState<View>({ kind: 'loading' })
  const [accepted, setAccepted] = useState(false)
  const [acceptError, setAcceptError] = useState('')

  useEffect(() => {
    if (!REFERENCE_RE.test(reference) || !reference.startsWith('SPP-')) {
      setView({ kind: 'error', message: 'This payment link is not valid. Please check the link we sent you.' })
      return
    }
    api
      .get<ProjectBooking>(`/api/project/booking?reference=${encodeURIComponent(reference)}`)
      .then((booking) => setView({ kind: 'ready', booking }))
      .catch((err) =>
        setView({
          kind: 'error',
          message:
            err instanceof ApiError && err.status === 404
              ? 'We could not find this project. Please check the link we sent you.'
              : err instanceof ApiError
                ? err.message
                : 'Could not load this project. Please try again.',
        }),
      )
  }, [reference])

  async function pay(booking: ProjectBooking) {
    if (!booking.due) return
    if (!accepted) {
      setAcceptError('Please confirm you agree to the scope, terms and refund policy.')
      return
    }
    setAcceptError('')
    const stage = booking.due.stage
    const label = stage === 'advance' ? `${ADVANCE_PERCENT}% advance` : 'balance'
    try {
      setView({ kind: 'working', booking, label: 'Opening secure payment…' })
      const order = await api.post<OrderResponse>('/api/project/create-order', { reference: booking.reference, acceptedTerms: true })
      const outcome = await openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        description: `${booking.packageName} · ${label} · ${booking.reference}`,
        prefill: { name: booking.clientName },
        notes: { project_reference: booking.reference, stage },
      })
      if (outcome.kind === 'dismissed') {
        setView({ kind: 'ready', booking, notice: 'Payment was not completed. You can try again whenever you are ready.' })
        return
      }
      if (outcome.kind === 'failed') {
        setView({ kind: 'ready', booking, notice: `${outcome.message} You have not been charged for this attempt.` })
        return
      }
      setView({ kind: 'working', booking, label: 'Confirming your payment…' })
      await api.post('/api/project/verify', outcome.response)
      const fresh = await api.get<ProjectBooking>(`/api/project/booking?reference=${encodeURIComponent(booking.reference)}`)
      setView({ kind: 'justPaid', booking: fresh, stage })
    } catch (err) {
      setView({
        kind: 'ready',
        booking,
        notice: `${err instanceof Error ? err.message : 'Something went wrong.'} If money was debited, please contact us with reference ${booking.reference}.`,
      })
    }
  }

  const booking = view.kind === 'loading' || view.kind === 'error' ? null : view.booking
  const stage = booking?.due?.stage

  return (
    <main id="main" className="container-page py-16 sm:py-24">
      <div className="mx-auto flex max-w-[640px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-espresso/70">Project Payment</p>
          <h1 className="font-display text-[clamp(32px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            {view.kind === 'justPaid'
              ? 'Payment received. Thank you.'
              : stage === 'balance'
                ? 'Pay the balance'
                : stage === 'advance'
                  ? 'Confirm your project'
                  : 'Your project'}
          </h1>
        </div>

        {view.kind === 'loading' && <p aria-live="polite">Loading your project…</p>}

        {view.kind === 'error' && (
          <div role="alert" className="flex flex-col gap-4 rounded-2xl border border-espresso/15 p-6">
            <p>{view.message}</p>
            <p className="text-sm text-espresso/75">Need help? Email us at {SITE.contact.email}.</p>
          </div>
        )}

        {booking && (
          <>
            <dl className="divide-y divide-espresso/15 rounded-2xl border border-espresso/15">
              <Row label="Reference" value={<span className="font-mono">{booking.reference}</span>} />
              <Row label="Client" value={`${booking.clientName}, ${booking.companyName}`} />
              <Row label="Package" value={`${booking.packageName} · ${formatInr(booking.packagePriceInr)}`} />
              <Row
                label={`Advance (${ADVANCE_PERCENT}%) — to start`}
                value={<>{formatInr(booking.advanceInr)} <Badge paid={booking.advancePaid} /></>}
              />
              <Row
                label={`Balance (${100 - ADVANCE_PERCENT}%) — after final delivery`}
                value={<>{formatInr(booking.balanceInr)} <Badge paid={booking.balancePaid} /></>}
              />
              <Row label="Status" value={STATUS_TEXT[booking.status]} />
              <div className="flex flex-col gap-2 p-5">
                <dt className="text-xs text-espresso/70">Agreed project scope</dt>
                <dd className="whitespace-pre-line text-[15px]">{booking.projectScope}</dd>
              </div>
            </dl>

            {view.kind === 'justPaid' && (
              <p role="status" className="rounded-2xl bg-espresso p-6 text-cream">
                {view.stage === 'advance'
                  ? `Your ${ADVANCE_PERCENT}% advance has been received and verified. Your project is confirmed, and we'll be in touch to begin work.`
                  : 'Your balance payment has been received and verified. Your project is now fully paid. Thank you!'}
              </p>
            )}

            {view.kind !== 'justPaid' && booking.due && (
              <div className="flex flex-col gap-5">
                <div role="note" className="flex flex-col gap-1.5 rounded-[10px] border border-espresso/25 p-4 text-sm">
                  <p className="font-semibold">Before you pay</p>
                  <p className="text-espresso/85">
                    {booking.due.stage === 'advance' ? PAYMENT_TERMS.beforeAdvance : PAYMENT_TERMS.beforeBalance}{' '}
                    <Link href="/refund-policy" className="link">Read the Refund Policy</Link>
                  </p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    aria-invalid={!!acceptError}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-espresso"
                  />
                  <span>
                    I agree to the project scope above, the <Link href="/terms" className="link">Terms &amp; Conditions</Link>{' '}
                    and the <Link href="/refund-policy" className="link">Refund Policy</Link>.
                  </span>
                </label>
                {acceptError && <p className="field-error" role="alert">{acceptError}</p>}
                {view.kind === 'ready' && view.notice && (
                  <p aria-live="polite" className="rounded-[10px] bg-espresso/5 p-3 text-sm">{view.notice}</p>
                )}
                <button
                  type="button"
                  className="btn-dark min-h-14 text-base"
                  disabled={view.kind === 'working'}
                  onClick={() => pay(booking)}
                >
                  {view.kind === 'working'
                    ? view.label
                    : `Pay ${booking.due.stage === 'advance' ? `${ADVANCE_PERCENT}% advance` : 'balance'} — ${formatInr(booking.due.amountInr)}`}
                </button>
                <p className="text-center text-xs text-espresso/70">Payments are processed by Razorpay. Prices in INR.</p>
              </div>
            )}

            {view.kind !== 'justPaid' && !booking.due && (
              <p className="rounded-2xl border border-espresso/15 p-5 text-sm text-espresso/85">
                There is nothing to pay right now.
                {booking.status === 'in_production' &&
                  ' The balance will be requested on this same link after final delivery.'}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function Badge({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="ml-2 rounded-full bg-espresso px-2 py-0.5 text-xs text-cream">Paid</span>
  ) : null
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
      <dt className="text-xs text-espresso/70">{label}</dt>
      <dd className="text-right text-[15px]">{value}</dd>
    </div>
  )
}
