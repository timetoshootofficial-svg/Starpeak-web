import Link from 'next/link'
import { LegalLayout } from '@/components/LegalLayout'
import { SITE } from '@/config/site'
import { CONSULTATION } from '@/shared/config/consultation'
import { formatInr } from '@/shared/config/packages'
import { ADVANCE_PERCENT, PAYMENT_TERMS } from '@/shared/config/payment-terms'

export function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund Policy"
      intro="Please read this policy before you book a consultation or make a project payment."
    >
      <h2>1. Our policy at a glance</h2>
      <ul>
        <li><strong>Consultation fee:</strong> non-refundable once payment is completed.</li>
        <li>
          <strong>Project advance ({ADVANCE_PERCENT}%):</strong> fully refundable if you cancel before
          work starts; non-refundable once work has started.
        </li>
        <li><strong>Project balance:</strong> paid after final delivery and non-refundable once paid.</li>
      </ul>
      <p>
        All of this is subject to applicable law and any specific written agreement between {SITE.name}{' '}
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
        <strong>{PAYMENT_TERMS.summary}</strong>
      </p>
      <h3>The {ADVANCE_PERCENT}% advance</h3>
      <ul>
        <li>{PAYMENT_TERMS.workStarts}</li>
        <li>
          <strong>Before work starts:</strong> if you cancel, we will refund the advance in full. Ask
          us in writing (by email) and quote your project reference. Refunds go back to the original
          payment method through Razorpay, usually within [number] working days of approval; your bank
          may take a few more days to show it.
        </li>
        <li>
          <strong>Once work has started:</strong> the advance is non-refundable, except where a refund
          is required by applicable law or expressly agreed in writing.
        </li>
      </ul>
      <h3>The balance</h3>
      <p>
        {PAYMENT_TERMS.balanceRefund} Please review the delivered film and use your included revision
        rounds before the final delivery is completed.
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
