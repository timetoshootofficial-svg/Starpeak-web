import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatInr } from '../../shared/config/packages'
import { REFERENCE_RE } from '../../shared/validation'
import { ApiError, api, type OrderResponse } from '../lib/api'
import { openCheckout } from '../lib/razorpay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { SITE } from '../config/site'

interface ProjectBooking {
  reference: string
  clientName: string
  companyName: string
  packageName: string
  packagePriceInr: number
  amountDueInr: number
  isAdvance: boolean
  projectScope: string
  status: string
  paymentStatus: string
}

type View =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; booking: ProjectBooking; notice?: string }
  | { kind: 'working'; booking: ProjectBooking; label: string }
  | { kind: 'paid'; booking: ProjectBooking }

/**
 * Private payment page for an approved project: /pay/SPP-XXXXXXXXXX.
 * The studio creates the booking (with the agreed scope) in Supabase and
 * sends this link to the client. Amounts come from the server only.
 */
export function ProjectPayment() {
  useDocumentTitle('Project Payment')
  const { reference = '' } = useParams()
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
      .then((booking) =>
        setView(booking.paymentStatus === 'paid' ? { kind: 'paid', booking } : { kind: 'ready', booking }),
      )
      .catch((err) =>
        setView({
          kind: 'error',
          message: err instanceof ApiError && err.status === 404
            ? 'We could not find this project. Please check the link we sent you.'
            : err instanceof ApiError ? err.message : 'Could not load this project. Please try again.',
        }),
      )
  }, [reference])

  async function pay(booking: ProjectBooking) {
    if (!accepted) {
      setAcceptError('Please confirm you have read and agree to the scope and policies.')
      return
    }
    setAcceptError('')
    try {
      setView({ kind: 'working', booking, label: 'Opening secure payment…' })
      const order = await api.post<OrderResponse>('/api/project/create-order', { reference: booking.reference, acceptedTerms: true })
      const outcome = await openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        description: `${booking.packageName} · ${booking.reference}`,
        prefill: { name: booking.clientName },
        notes: { project_reference: booking.reference },
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
      setView({ kind: 'paid', booking })
    } catch (err) {
      setView({
        kind: 'ready',
        booking,
        notice: `${err instanceof Error ? err.message : 'Something went wrong.'} If money was debited, please contact us with reference ${booking.reference}.`,
      })
    }
  }

  return (
    <main id="main" className="container-page py-16 sm:py-24">
      <div className="mx-auto flex max-w-[640px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-espresso/70">Project Payment</p>
          <h1 className="font-display text-[clamp(32px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            {view.kind === 'paid' ? 'Payment received. Thank you.' : 'Confirm your project'}
          </h1>
        </div>

        {view.kind === 'loading' && <p aria-live="polite">Loading your project…</p>}

        {view.kind === 'error' && (
          <div role="alert" className="flex flex-col gap-4 rounded-2xl border border-espresso/15 p-6">
            <p>{view.message}</p>
            <p className="text-sm text-espresso/75">Need help? Email us at {SITE.contact.email}.</p>
          </div>
        )}

        {view.kind !== 'loading' && view.kind !== 'error' && (
          <>
            <dl className="divide-y divide-espresso/15 rounded-2xl border border-espresso/15">
              <Row label="Reference" value={<span className="font-mono">{view.booking.reference}</span>} />
              <Row label="Client" value={`${view.booking.clientName}, ${view.booking.companyName}`} />
              <Row label="Package" value={`${view.booking.packageName} (${formatInr(view.booking.packagePriceInr)})`} />
              <Row
                label={view.booking.isAdvance ? 'Agreed advance payment' : 'Amount to pay'}
                value={<strong className="font-display text-2xl">{formatInr(view.booking.amountDueInr)}</strong>}
              />
              <div className="flex flex-col gap-2 p-5">
                <dt className="text-xs text-espresso/70">Agreed project scope</dt>
                <dd className="whitespace-pre-line text-[15px]">{view.booking.projectScope}</dd>
              </div>
            </dl>

            {view.kind === 'paid' ? (
              <p role="status" className="rounded-2xl bg-espresso p-6 text-cream">
                Your payment for {view.booking.reference} has been received and verified. Your project is confirmed, and
                we'll be in touch about the next steps.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                <div role="note" className="flex flex-col gap-1.5 rounded-[10px] border border-espresso/25 p-4 text-sm">
                  <p className="font-semibold">Before you pay</p>
                  <p className="text-espresso/85">
                    Project payments are non-refundable once the booking is confirmed or production work has commenced,
                    except where a refund is required by applicable law or expressly agreed in writing. Please review the
                    scope above carefully. <Link to="/refund-policy" className="link">Read the Refund Policy</Link>
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
                    I agree to the project scope above, the <Link to="/terms" className="link">Terms &amp; Conditions</Link> and
                    the <Link to="/refund-policy" className="link">Refund Policy</Link>.
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
                  onClick={() => pay(view.booking)}
                >
                  {view.kind === 'working' ? view.label : `Pay ${formatInr(view.booking.amountDueInr)} securely`}
                </button>
                <p className="text-center text-xs text-espresso/70">Payments are processed by Razorpay. Prices in INR.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
      <dt className="text-xs text-espresso/70">{label}</dt>
      <dd className="text-right text-[15px]">{value}</dd>
    </div>
  )
}
