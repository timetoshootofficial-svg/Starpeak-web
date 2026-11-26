import Link from 'next/link'
import { LegalLayout } from '@/components/LegalLayout'
import { SITE } from '@/config/site'
import { CONSULTATION } from '@/shared/config/consultation'
import { PACKAGES, formatInr } from '@/shared/config/packages'
import type { FilmPackage } from '@/shared/config/packages'

/** The package's revision line (e.g. "Two revision rounds"), read from its deliverables. */
function revisionLine(pkg: FilmPackage): string | undefined {
  const items = [...pkg.includes, ...(pkg.groups ?? []).flatMap((g) => g.items)]
  return items.find((item) => /revision/i.test(item))
}

export function Terms() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      intro={`These terms apply when you use this website, book a consultation or work with ${SITE.name} on an advertising film. By using the site or making a payment, you agree to them.`}
    >
      <h2>1. About us</h2>
      <p>
        This website is operated by {SITE.legal.entityName} (trading as {SITE.name}), an AI
        advertising film studio with its registered address at {SITE.legal.address}. &quot;We&quot;,
        &quot;us&quot; and &quot;our&quot; refer to {SITE.name}; &quot;you&quot; and &quot;the
        client&quot; refer to the person or business using our website or services.
      </p>

      <h2>2. Using this website</h2>
      <ul>
        <li>You may use this website to learn about our services, contact us and book with us.</li>
        <li>
          Please do not misuse the site, submit false information, attempt to interfere with its
          security, or copy our content, films or designs without permission.
        </li>
        <li>
          Information on the site, including package descriptions and prices, is a general guide and
          may change. The scope agreed in writing for your project takes priority.
        </li>
      </ul>

      <h2>3. Project inquiries</h2>
      <p>
        You can submit a project inquiry for one of our packages through the website. An inquiry
        tells us what you need so that we can contact you. <strong>Submitting an inquiry is not a
        booking</strong>, does not reserve production time, and does not create any payment
        obligation for you or any commitment from us.
      </p>

      <h2>4. Consultation bookings</h2>
      <ul>
        <li>
          Consultations cost {formatInr(CONSULTATION.feeInr)} and are paid online through Razorpay
          when you book.
        </li>
        <li>A consultation is confirmed only after the payment has been completed successfully.</li>
        <li>
          Unpaid bookings hold the selected slot for a limited time only, after which the slot may be
          released.
        </li>
        <li>
          The consultation is a discussion and advisory session. It does not include production work
          and does not commit either party to a project.
        </li>
        <li>{CONSULTATION.refundNotice}</li>
      </ul>

      <h2>5. Project confirmation</h2>
      <p>
        <strong>
          Project scope and deliverables will be confirmed in writing before production begins.
        </strong>{' '}
        After we discuss your brief, we will share the agreed scope, deliverables, timeline and
        payment terms in writing (for example, by email). A project is confirmed only when you have
        accepted those terms and the agreed payment has been received.
      </p>

      <h2>6. Payment terms</h2>
      <ul>
        <li>All prices are in Indian Rupees (INR).</li>
        <li>
          Payments are made online through Razorpay, using the website checkout or a private payment
          link we send you.
        </li>
        <li>
          Projects are paid in full before production begins, unless an advance payment and a
          schedule for the balance have been agreed in writing.
        </li>
        <li>
          Payment amounts are checked on our server against the agreed price. A payment counts only
          once it has been successfully completed and verified.
        </li>
        <li>[Applicable taxes, if any, will be shown on the invoice.]</li>
      </ul>

      <h2>7. Non-refundable payments</h2>
      <p>
        Consultation fees and project payments are non-refundable once payment has been completed,
        subject to applicable law and any specific written agreement. Please read our{' '}
        <Link href="/refund-policy">Refund Policy</Link> for full details, including how we handle
        failed or duplicate payments.
      </p>

      <h2>8. Project scope</h2>
      <p>
        We will deliver the work described in the written scope for your project. Anything not
        listed there, such as extra films, longer durations, additional versions, new formats or
        changes to the concept after approval, is outside the scope and may be quoted separately.
        Timelines depend on you providing information, materials and feedback on time.
      </p>

      <h2>9. Revisions</h2>
      <p>The number of revision rounds included depends on your package:</p>
      <ul>
        {PACKAGES.map((pkg) => (
          <li key={pkg.id}>
            <strong>{pkg.name}</strong> ({formatInr(pkg.priceInr)}):{' '}
            {revisionLine(pkg) ?? 'as agreed in writing'}
          </li>
        ))}
      </ul>
      <p>
        A revision round means one consolidated set of feedback on the current version, within the
        approved concept and script. Additional revision rounds, or changes that alter the agreed
        scope, may be quoted separately. Unused revision rounds expire [number] days after delivery.
      </p>

      <h2>10. Your responsibilities</h2>
      <ul>
        <li>Provide accurate and complete information about your business and requirements.</li>
        <li>Supply brand assets (such as logos, product images, fonts and guidelines) on time.</li>
        <li>Give clear, consolidated feedback within [number] days of each delivery.</li>
        <li>
          Make sure you own or have permission to use every material you give us, and that our use of
          it for your project will not infringe anyone else&apos;s rights.
        </li>
        <li>Give approvals at each agreed stage, such as the concept, script and final film.</li>
      </ul>

      <h2>11. Intellectual property</h2>
      <ul>
        <li>
          On receipt of full payment, [ownership of / a licence to use] the final delivered film
          passes to you on the terms agreed in writing for your project.
        </li>
        <li>
          {SITE.name} keeps ownership of its pre-existing materials, tools, workflows, templates and
          any concepts, drafts or ideas that are not used in your final film.
        </li>
        <li>You keep ownership of the brand assets and materials you supply to us.</li>
        <li>
          Our films are made using AI tools. You are responsible for checking that the final content
          is suitable for your intended use, and that any claims made in your advertising (for
          example, about your product, prices or results) are accurate and lawful.
        </li>
      </ul>

      <h2>12. Portfolio use</h2>
      <p>
        We may show the work we create for you in our portfolio, website and social media, unless you
        ask us in writing not to. We will not share confidential information you have marked as
        such.
      </p>

      <h2>13. Project cancellation</h2>
      <p>
        If you wish to cancel a confirmed project, please tell us in writing as soon as possible.
        Payments already made are handled under our <Link href="/refund-policy">Refund Policy</Link>.
        If you do not respond to our requests for materials or feedback for [number] days, we may
        treat the project as paused or closed. We may cancel a project if the brief requires
        content that is unlawful, misleading or harmful.
      </p>

      <h2>14. Campaign results</h2>
      <p>
        Some packages include campaign strategy support. We will provide this with reasonable care
        and skill, but <strong>results are not guaranteed</strong>. Enquiries, sales and other
        outcomes depend on factors outside our control, including your offer, product quality,
        pricing, location, audience and execution.
      </p>

      <h2>15. Limitation of liability</h2>
      <p>
        We will provide our services with reasonable care and skill. To the extent permitted by
        applicable law, we are not liable for indirect or consequential losses, such as loss of
        profit, revenue or business opportunity, and our total liability for any claim relating to
        a service is limited to the amount you paid us for that service. Nothing in these terms
        limits any liability that cannot be limited under applicable law.
      </p>

      <h2>16. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Any dispute will be subject to the
        jurisdiction of the courts at {SITE.legal.jurisdiction}. We encourage you to contact us
        first so that we can try to resolve any concern informally.
      </p>

      <h2>17. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The version shown on this page, with its
        &quot;Last updated&quot; date, applies to new bookings and payments. Terms agreed in writing
        for a confirmed project continue to apply to that project.
      </p>

      <h2>18. Contact</h2>
      <p>
        For questions about these terms, email{' '}
        <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a>, use the{' '}
        <Link href="/#contact">contact section</Link>, or{' '}
        <Link href="/#consultation">book a consultation</Link>. Please also read our{' '}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
      <p>
        {SITE.legal.entityName}
        <br />
        {SITE.legal.address}
      </p>
    </LegalLayout>
  )
}
