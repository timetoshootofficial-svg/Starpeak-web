import { SITE } from '@/config/site'

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="py-20 sm:py-36">
      <div className="container-page flex flex-col gap-8 lg:flex-row lg:gap-20">
        <h2 id="about-title" className="eyebrow text-espresso/70 lg:w-60 lg:shrink-0">About {SITE.shortName}</h2>
        <div className="flex flex-col gap-7">
          <p className="font-display text-[clamp(26px,2.8vw,38px)] font-semibold leading-[1.25] tracking-[-0.03em]">
            {SITE.name} is an AI advertising film studio built on brand storytelling.
          </p>
          <p className="max-w-[620px] text-[17px] text-espresso/80">
            We understand your brand, develop the idea, write the story, and bring it to life with AI: cinematic ads
            made in less time, at lower cost, with no limits on imagination.
          </p>
        </div>
      </div>
    </section>
  )
}
