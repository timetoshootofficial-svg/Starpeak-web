import { WHY_AI } from '@/config/services'

export function WhyAi() {
  return (
    <section aria-labelledby="why-ai-title" className="py-18 sm:py-28">
      <div className="container-page flex flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-4">
            <p className="eyebrow text-espresso/70">Why AI Ad Films</p>
            <h2 id="why-ai-title" className="font-display text-[clamp(32px,3.4vw,46px)] font-semibold leading-[1.08] tracking-[-0.03em]">
              A strong story. No limits on screen.
            </h2>
          </div>
          <p className="max-w-[340px] text-espresso/75">
            When a good story meets AI filmmaking, your brand can be shown any way you imagine it.
          </p>
        </div>
        <ol className="grid gap-10 sm:grid-cols-3">
          {WHY_AI.map((item, i) => (
            <li key={item.title} className="flex flex-col gap-3">
              <span className="text-[13px] tabular-nums text-espresso/70">0{i + 1}</span>
              <h3 className="font-display text-[22px] font-semibold leading-tight tracking-[-0.03em]">{item.title}</h3>
              <p className="text-[15px] text-espresso/75">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
