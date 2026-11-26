import Link from 'next/link'
import { LegalLayout } from '@/components/LegalLayout'
import { SITE } from '@/config/site'
import { CONSULTATION } from '@/shared/config/consultation'
import { formatInr } from '@/shared/config/packages'

export function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund Policy"
      intro="Please read this policy before you book a consultation or make a project payment."
    >
      <h2>1. Our policy</h2>
      <p>
        All consultation fees and project payments are non-refundable once payment has been
        completed, subject to applicable law and any specific written agreement between {SITE.name}{' '}
        and the client.
      </p>
      <p>
        Please review the project scope, deliverables, timeline, and payment terms carefully before
        making a payment.
      </p>

      <h2>2. Consultation fee</h2>
      <p>
        Consultation bookings are non-refundable. The consultation fee is{' '}
        {formatInr(CONSULTATION.feeInr)}, paid online through Razorpay when you book.
      </p>
      <p>
        <strong>{CONSULTATION.refundNotice}</strong>
      </p>
      <p>
        The fee covers our time to prepare for and hold the consultation. It is not refunded based
        on the outcome of the discussion or whether you go ahead with a project.
      </p>

      <h2>3. Project payments</h2>
      <p>
        Submitting a project inquiry is not a booking and does not require any payment. Before you
        pay for a project, we agree the scope, deliverables, timeline and payment terms with you in
        writing, and then send you a private Razorpay payment link.
      </p>
      <p>
        Project payments are non-refundable once the booking is confirmed or production work has
        commenced, except where a refund is required by applicable law or expressly agreed in
        writing. This also applies to any advance payment agreed in writing.
      </p>

      <h2>4. Failed or duplicate payments</h2>
      <p>Payment errors are handled separately from refunds. If:</p>
      <ul>
        <li>money was debited from your account but your booking was not confirmed, or</li>
        <li>you were charged more than once for the same booking or project,</li>
      </ul>
      <p>
        please contact us with your Razorpay payment ID (shown in your payment confirmation or bank
        statement), the date of payment and the email address you used. We will investigate with
        Razorpay and, where a payment error is confirmed, resolve it. Failed payments are often
        reversed automatically by the bank or payment provider within their usual timelines.
      </p>
      <p>
        This section covers payment errors only. It is not a promise of a refund for a consultation
        or project that has been confirmed or delivered.
      </p>

      <h2>5. Rescheduling</h2>
      <p>
        If you cannot attend a booked consultation, please contact us as early as possible.
        Rescheduling may be offered at our discretion, depending on availability, and is not
        guaranteed.
      </p>

      <h2>6. Contact us</h2>
      <p>
        For payment issues or questions about this policy, email{' '}
        <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> or use the{' '}
        <Link href="/#contact">contact section</Link> of our website. Please include your payment ID
        where relevant.
      </p>
      <p>
        See also our <Link href="/terms">Terms &amp; Conditions</Link> and{' '}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
    </LegalLayout>
  )
}
