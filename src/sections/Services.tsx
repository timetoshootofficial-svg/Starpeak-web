import { SERVICES } from '@/config/services'

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="py-18 sm:py-28">
      <div className="container-page flex flex-col gap-12 lg:flex-row lg:gap-20">
        <div className="flex max-w-[360px] flex-col gap-4 lg:flex-[1_1_280px]">
          <p className="eyebrow text-espresso/70">What we do</p>
          <h2 id="services-title" className="heading-xl">Services</h2>
          <p className="text-espresso/75">
            We understand the brand, shape the idea and write the story. Then we bring it to the screen with AI.
          </p>
        </div>
        <ol className="border-t border-espresso/15 lg:flex-[2_1_520px]">
          {SERVICES.map((s, i) => (
            <li key={s.title} className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-b border-espresso/15 py-7">
              <span className="w-8 text-[13px] tabular-nums text-espresso/70">0{i + 1}</span>
              <h3 className="flex-[1_1_220px] font-display text-2xl font-semibold leading-tight tracking-[-0.03em]">{s.title}</h3>
              <p className="flex-[1_1_240px] text-[15px] text-espresso/75">{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
