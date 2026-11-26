import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CONSULTATION } from '../../shared/config/consultation'
import { bookableDates, formatDateLong, formatDateParts, formatTime12h, openTimesFor } from '../../shared/slots'
import { validateConsultation, type FieldErrors } from '../../shared/validation'
import { ApiError, api, type ConsultationConfirmation, type OrderResponse } from '../lib/api'
import { openCheckout } from '../lib/razorpay'
import { usePaymentsStatus } from '../lib/usePaymentsStatus'
import { SITE } from '../config/site'
import { Honeypot, TextArea, TextField } from '../components/FormControls'

type Phase =
  | { kind: 'form' }
  | { kind: 'working'; label: string }
  | { kind: 'awaiting'; order: OrderResponse; message: string }
  | { kind: 'confirmed'; booking: ConsultationConfirmation }

const EMPTY = { name: '', email: '', phone: '', brandName: '', brief: '' }

export function ConsultationBooking() {
  const payments = usePaymentsStatus()
  const dates = useMemo(() => bookableDates(), [])
  const [fields, setFields] = useState(EMPTY)
  const [date, setDate] = useState(dates[0] ?? '')
  const [time, setTime] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'form' })
  const [taken, setTaken] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const times = useMemo(() => (date ? openTimesFor(date) : []), [date])

  // Load booked slots for the chosen date.
  useEffect(() => {
    if (!date || !payments.enabled) return
    let cancelled = false
    setSlotsLoading(true)
    api
      .get<{ unavailable: string[] }>(`/api/consultation/slots?date=${date}`)
      .then((r) => !cancelled && setTaken(r.unavailable))
      .catch(() => !cancelled && setTaken([]))
      .finally(() => !cancelled && setSlotsLoading(false))
    return () => {
      cancelled = true
    }
  }, [date, payments.enabled])

  useEffect(() => {
    if (time && taken.includes(time)) setTime('')
  }, [taken, time])

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setFields((f) => ({ ...f, [key]: e.target.value }))

  async function pay(order: OrderResponse) {
    setFormError('')
    try {
      setPhase({ kind: 'working', label: 'Opening secure payment…' })
      const outcome = await openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        description: `Consultation · ${formatDateLong(date)}, ${formatTime12h(time)}`,
        prefill: { name: fields.name, email: fields.email, contact: fields.phone },
        notes: { booking_reference: order.reference },
      })
      if (outcome.kind === 'dismissed') {
        setPhase({
          kind: 'awaiting',
          order,
          message: `Payment was not completed. Your slot is held for ${CONSULTATION.holdMinutes} minutes, so you can try again.`,
        })
        return
      }
      if (outcome.kind === 'failed') {
        setPhase({ kind: 'awaiting', order, message: `${outcome.message} No booking has been made. You can try again.` })
        return
      }
      setPhase({ kind: 'working', label: 'Confirming your payment…' })
      const booking = await api.post<ConsultationConfirmation>('/api/consultation/verify', outcome.response)
      setPhase({ kind: 'confirmed', booking })
    } catch (err) {
      setPhase({
        kind: 'awaiting',
        order,
        message:
          err instanceof ApiError || err instanceof Error
            ? `${err.message} If money was debited, please contact us with your booking reference ${order.reference}.`
            : 'Something went wrong. Please try again.',
      })
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const result = validateConsultation({ ...fields, date, time, acceptedPolicies: accepted })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    if (!payments.enabled) {
      setFormError(`Online booking isn't open yet. To book a consultation, email us at ${SITE.contact.email}.`)
      return
    }
    setPhase({ kind: 'working', label: 'Reserving your slot…' })
    try {
      const order = await api.post<OrderResponse>('/api/consultation/create-order', { ...result.data, website: honeypot })
      await pay(order)
    } catch (err) {
      setPhase({ kind: 'form' })
      if (err instanceof ApiError) {
        if (err.fieldErrors) setErrors(err.fieldErrors)
        if (err.code === 'slot_taken') setTaken((t) => [...t, time])
        setFormError(err.message)
      } else setFormError('Something went wrong. Please try again.')
    }
  }

  if (phase.kind === 'confirmed') return <Confirmation booking={phase.booking} email={fields.email} />

  const busy = phase.kind === 'working'
  const locked = busy || phase.kind === 'awaiting'
  const disabled = !payments.enabled

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Consultation booking"
      className="relative flex flex-col gap-6 rounded-2xl bg-cream p-6 text-espresso sm:p-10"
    >
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <fieldset disabled={locked} className="contents">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Name" autoComplete="name" value={fields.name} onChange={set('name')} error={errors.name} />
          <TextField label="Email" type="email" autoComplete="email" value={fields.email} onChange={set('email')} error={errors.email} />
          <TextField label="Phone Number" type="tel" autoComplete="tel" placeholder="+91" value={fields.phone} onChange={set('phone')} error={errors.phone} />
          <TextField label="Brand Name" autoComplete="organization" value={fields.brandName} onChange={set('brandName')} error={errors.brandName} />
        </div>

        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="mb-3 text-[13px] font-medium">Consultation Date</legend>
          <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Consultation date">
            {dates.map((d) => {
              const p = formatDateParts(d)
              const on = d === date
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={formatDateLong(d)}
                  onClick={() => {
                    setDate(d)
                    setTime('')
                  }}
                  className={`flex min-h-16 min-w-[76px] shrink-0 flex-col items-center justify-center rounded-[10px] border text-sm transition-colors ${on ? 'border-espresso bg-espresso text-cream' : 'border-espresso/25 hover:border-espresso'}`}
                >
                  <span className="text-xs">{p.weekday}</span>
                  <span className="text-base font-semibold">{p.day} {p.month}</span>
                </button>
              )
            })}
          </div>
          {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="mb-3 text-[13px] font-medium">Preferred Time <span className="font-normal text-espresso/70">(IST)</span></legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Consultation time" aria-busy={slotsLoading}>
            {times.map((t) => {
              const isTaken = taken.includes(t)
              const on = t === time
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={isTaken}
                  aria-label={isTaken ? `${formatTime12h(t)}, already booked` : formatTime12h(t)}
                  onClick={() => setTime(t)}
                  className={`min-h-12 rounded-[10px] border text-sm transition-colors ${
                    isTaken
                      ? 'cursor-not-allowed border-dashed border-espresso/25 bg-espresso/5 text-espresso/65 line-through'
                      : on
                        ? 'border-espresso bg-espresso text-cream'
                        : 'border-espresso/25 hover:border-espresso'
                  }`}
                >
                  {formatTime12h(t)}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-espresso/70">Struck-through times are already booked.</p>
          {errors.time && <p className="field-error" role="alert">{errors.time}</p>}
        </fieldset>

        <TextArea label="Brief Description" rows={3} placeholder="What would you like to discuss?" value={fields.brief} onChange={set('brief')} error={errors.brief} />

        <div role="note" className="flex flex-col gap-1.5 rounded-[10px] border border-espresso/25 p-4">
          <p className="text-sm font-semibold">Non-refundable</p>
          <p className="text-sm text-espresso/85">
            {CONSULTATION.refundNotice}{' '}
            <Link to="/refund-policy" className="link">Read the Refund Policy</Link>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              aria-invalid={!!errors.acceptedPolicies}
              className="mt-0.5 h-5 w-5 shrink-0 accent-espresso"
            />
            <span>
              I have read the <Link to="/refund-policy" className="link">Refund Policy</Link>,{' '}
              <Link to="/terms" className="link">Terms</Link> and <Link to="/privacy-policy" className="link">Privacy Policy</Link>.
            </span>
          </label>
          {errors.acceptedPolicies && <p className="field-error" role="alert">{errors.acceptedPolicies}</p>}
        </div>
      </fieldset>

      {phase.kind === 'awaiting' ? (
        <div className="flex flex-col gap-3" aria-live="polite">
          <p className="rounded-[10px] bg-espresso/5 p-4 text-sm">{phase.message}</p>
          <button type="button" className="btn-dark min-h-14 text-base" onClick={() => pay(phase.order)}>
            Try payment again — ₹{CONSULTATION.feeInr}
          </button>
          <button
            type="button"
            className="text-sm underline underline-offset-4"
            onClick={() => setPhase({ kind: 'form' })}
          >
            Change details or time
          </button>
        </div>
      ) : (
        <button type="submit" className="btn-dark min-h-14 text-base" disabled={busy}>
          {busy ? phase.label : `Book Consultation — ₹${CONSULTATION.feeInr}`}
        </button>
      )}

      <div aria-live="polite" className="flex flex-col gap-2 text-center text-xs text-espresso/75">
        {formError && <p className="rounded-[10px] bg-espresso/5 p-3 text-sm font-medium text-espresso">{formError}</p>}
        {disabled && !payments.loading && !formError && (
          <p className="text-sm text-espresso">
            Online booking isn't open yet. To book a consultation, email us at {SITE.contact.email}.
          </p>
        )}
        <p>
          {date && time ? `Selected: ${formatDateLong(date)}, ${formatTime12h(time)} IST · ` : ''}
          Payment is processed securely by Razorpay. Your booking is confirmed only after payment is verified.
        </p>
      </div>
    </form>
  )
}

function Confirmation({ booking, email }: { booking: ConsultationConfirmation; email: string }) {
  const ok = booking.status === 'confirmed'
  return (
    <div role="status" className="flex flex-col gap-6 rounded-2xl bg-cream p-6 text-espresso sm:p-10">
      <p className="eyebrow text-espresso/70">{ok ? 'Payment received' : 'Payment received — action needed'}</p>
      <h3 className="font-display text-3xl font-semibold tracking-[-0.03em]">
        {ok ? 'Your consultation is booked.' : 'We received your payment.'}
      </h3>
      {!ok && (
        <p className="text-espresso/85">
          The time you chose was taken while your payment was processing. We'll contact you shortly to arrange
          another time that suits you. Please keep your booking reference.
        </p>
      )}
      <dl className="grid gap-px overflow-hidden rounded-[10px] border border-espresso/15 bg-espresso/15 sm:grid-cols-3">
        <div className="bg-cream p-4">
          <dt className="text-xs text-espresso/70">Booking reference</dt>
          <dd className="mt-1 font-mono text-lg font-semibold">{booking.reference}</dd>
        </div>
        <div className="bg-cream p-4">
          <dt className="text-xs text-espresso/70">Date</dt>
          <dd className="mt-1 font-semibold">{formatDateLong(booking.date)}</dd>
        </div>
        <div className="bg-cream p-4">
          <dt className="text-xs text-espresso/70">Time (IST)</dt>
          <dd className="mt-1 font-semibold">{formatTime12h(booking.time)}</dd>
        </div>
      </dl>
      <p className="text-sm text-espresso/80">
        {booking.emailSent
          ? `A confirmation has been sent to ${email}.`
          : 'Please save this reference. If you need to reach us, quote it in your message.'}{' '}
        {CONSULTATION.refundNotice}
      </p>
    </div>
  )
}
