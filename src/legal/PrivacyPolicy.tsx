import Link from 'next/link'
import { LegalLayout } from '@/components/LegalLayout'
import { SITE } from '@/config/site'
import { CONSULTATION } from '@/shared/config/consultation'
import { formatInr } from '@/shared/config/packages'

export function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro={`This policy explains what personal information ${SITE.name} collects through this website, why we collect it, how we look after it, and the choices you have.`}
    >
      <h2>1. Who we are</h2>
      <p>
        This website is operated by {SITE.legal.entityName} (trading as {SITE.name}), an AI
        advertising film studio based in India. Our registered address is {SITE.legal.address}. In
        this policy, &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refer to {SITE.name}.
      </p>

      <h2>2. Information we collect</h2>
      <p>We only collect information you choose to give us, plus basic technical data needed to run the site:</p>
      <ul>
        <li>
          <strong>Contact details:</strong> your name, email address and phone number.
        </li>
        <li>
          <strong>Business details:</strong> your brand or company name.
        </li>
        <li>
          <strong>Project and consultation details:</strong> what you tell us about your brand,
          project, goals, budget or preferred package, and the date and time you choose for a
          consultation.
        </li>
        <li>
          <strong>Payment-related information:</strong> Razorpay order IDs, payment IDs, the amount
          and the payment status (for example, paid or failed).
        </li>
        <li>
          <strong>Technical data:</strong> standard server logs kept by our hosting provider, such as
          IP address, browser type and the time of a request.
        </li>
      </ul>
      <p>
        <strong>We do not collect or store your card, UPI or bank account details.</strong> These are
        entered directly into Razorpay&apos;s secure checkout and handled by Razorpay, not by us.
      </p>

      <h3>Consultation bookings</h3>
      <p>
        When you book a paid consultation ({formatInr(CONSULTATION.feeInr)}), we collect your name,
        email, phone number, brand name, a short description of what you would like to discuss, your
        chosen date and time slot, and the payment reference and status returned by Razorpay.
      </p>

      <h3>Project inquiries</h3>
      <p>
        When you submit a project inquiry, we collect your contact details, brand or company name,
        the package you are interested in and the project details you provide. Submitting an inquiry
        does not create a booking or a payment obligation. If you later go ahead with a project, we
        also keep the payment references linked to that project.
      </p>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To confirm, schedule and hold your consultation.</li>
        <li>To respond to your project inquiry and prepare a scope, quote and timeline.</li>
        <li>To process and verify payments, and to handle payment problems.</li>
        <li>To send you confirmations and messages about your booking or project.</li>
        <li>To keep business, tax and accounting records.</li>
        <li>To keep the website secure and prevent misuse.</li>
      </ul>
      <p>
        We do not sell your personal information, and we do not use it for third-party advertising.
      </p>

      <h2>4. Service providers we use</h2>
      <h3>Data storage</h3>
      <p>
        Booking and inquiry records are stored in a database hosted by Supabase. Access is limited to
        us and to the systems that run this website.
      </p>

      <h3>Payments</h3>
      <p>
        Payments are processed by Razorpay. When you pay, Razorpay collects and processes your
        payment details under its own terms and privacy policy, which you can read at{' '}
        <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">
          razorpay.com/privacy
        </a>
        . We receive only the order ID, payment ID, amount and status.
      </p>

      <h3>Email</h3>
      <p>
        If configured, confirmation emails are sent through an email delivery provider. That provider
        receives only what is needed to deliver the message, such as your name, email address and the
        content of the email.
      </p>

      <h3>Hosting</h3>
      <p>
        This website is hosted on Vercel. Like most hosts, Vercel keeps short-term server logs (such
        as IP addresses and request times) to operate and secure the service.
      </p>

      <h3>Analytics</h3>
      <p>
        We do not currently use analytics or tracking tools on this website. Our fonts are
        self-hosted, so loading the site does not send your data to a font provider. If we add
        analytics in future, we will update this policy first.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We do not set any cookies of our own. When you open the Razorpay checkout to make a payment,
        Razorpay may set cookies that are needed for the payment to work securely. Those cookies are
        controlled by Razorpay.
      </p>

      <h2>6. How long we keep your information</h2>
      <ul>
        <li>
          Consultation and project inquiry records: for [retention period] after our last contact
          with you, unless you ask us to delete them sooner.
        </li>
        <li>
          Records of paid consultations and projects: for as long as required by law for tax and
          accounting purposes.
        </li>
        <li>Unpaid or abandoned booking attempts: for [retention period].</li>
      </ul>
      <p>When information is no longer needed, we delete it or anonymise it.</p>

      <h2>7. How we protect your information</h2>
      <p>
        We take reasonable technical and organisational measures to protect your information,
        including encrypted connections (HTTPS), restricted access to our database and keeping
        payment details with Razorpay rather than on our systems. However, no website or online
        service can be guaranteed to be completely secure.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Subject to applicable Indian law, including the Digital Personal Data Protection Act, 2023,
        you may ask us to:
      </p>
      <ul>
        <li>tell you what personal information we hold about you;</li>
        <li>correct or update information that is inaccurate or incomplete;</li>
        <li>
          delete your information, where we are not required to keep it (for example, for tax
          records);
        </li>
        <li>withdraw consent you have given us, for future processing.</li>
      </ul>
      <p>
        If you have a concern or complaint about how we handle your information, you can raise it
        with us using the contact details below and we will try to resolve it. To protect your
        privacy, we may need to verify your identity before acting on a request.
      </p>

      <h2>9. Children</h2>
      <p>
        Our services are intended for businesses and adults. We do not knowingly collect personal
        information from anyone under 18. If you believe a child has given us their information,
        please contact us and we will delete it.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The &quot;Last updated&quot; date at the top of
        this page shows when it was last changed. Please also read our{' '}
        <Link href="/refund-policy">Refund Policy</Link> and{' '}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>

      <h2>11. Contact us</h2>
      <p>
        For privacy requests or questions about this policy, email{' '}
        <a href={`mailto:${SITE.legal.privacyEmail}`}>{SITE.legal.privacyEmail}</a>. For anything
        else, email <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> or use the{' '}
        <Link href="/#contact">contact section</Link> of our website.
      </p>
      <p>
        {SITE.legal.entityName}
        <br />
        {SITE.legal.address}
      </p>
    </LegalLayout>
  )
}
