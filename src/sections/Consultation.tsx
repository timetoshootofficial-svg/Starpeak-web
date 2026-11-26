import { CONSULTATION } from '@/shared/config/consultation'
import { ConsultationBooking } from './ConsultationBooking'

const STEPS = [
  'Pick an open date and time',
  `Pay ₹${CONSULTATION.feeInr} securely through Razorpay`,
  'Get your booking reference on screen and by email',
]

export function Consultation() {
  return (
    <section id="consultation" aria-labelledby="consultation-title" className="bg-espresso py-18 text-cream sm:py-28">
      <div className="container-page flex flex-col items-start gap-14 lg:flex-row lg:gap-20">
        <div className="flex flex-col gap-6 lg:max-w-[440px] lg:flex-[1_1_320px]">
          <p className="eyebrow text-cream/70">Paid Consultation</p>
          <h2 id="consultation-title" className="heading-xl">Let's Discuss Your Brand.</h2>
          <p className="text-cream/80">
            Book a consultation to discuss your advertising idea, brand requirements, and project possibilities.
          </p>
          <div className="flex items-baseline gap-3 border-y border-cream/20 py-5">
            <span className="font-display text-[52px] font-semibold leading-none tracking-[-0.03em]">₹{CONSULTATION.feeInr}</span>
            <span className="text-sm text-cream/75">per consultation</span>
          </div>
          <ol className="flex flex-col gap-3.5 text-[15px] text-cream/85">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3.5">
                <span className="tabular-nums text-cream/65">0{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="w-full min-w-0 lg:flex-[1.4_1_460px]">
          <ConsultationBooking />
        </div>
      </div>
    </section>
  )
}
