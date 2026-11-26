import { SELECTED_WORK } from '@/config/portfolio'
import { FilmCard } from '@/components/FilmCard'

export function SelectedWork() {
  const [featured, ...rest] = SELECTED_WORK
  const hasPlaceholders = SELECTED_WORK.some((f) => f.placeholder)
  return (
    <section id="work" aria-labelledby="work-title" className="rounded-[32px] bg-espresso py-18 text-cream sm:rounded-[50px] sm:py-28">
      <div className="container-page flex flex-col gap-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-4">
            <p className="eyebrow text-cream/70">AI Ad Films</p>
            <h2 id="work-title" className="heading-xl">Selected Work</h2>
          </div>
          {hasPlaceholders && (
            <p className="max-w-[320px] text-sm text-cream/70">Placeholder projects, to be replaced with portfolio films.</p>
          )}
        </div>

        {featured && (
          <article className="flex flex-col gap-5">
            <div className="[&>button]:aspect-[21/9]">
              <FilmCard film={featured} index={0} size="lg" />
            </div>
            <div className="flex flex-wrap justify-between gap-x-10 gap-y-3">
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-[0.18em] text-cream/70">{featured.category}</p>
                <h3 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.03em]">{featured.title}</h3>
              </div>
              <p className="max-w-[420px] text-[15px] text-cream/75">{featured.description}</p>
            </div>
          </article>
        )}

        <div className="grid gap-10 md:grid-cols-2">
          {rest.map((film, i) => (
            <article key={film.id} className="flex flex-col gap-4">
              <FilmCard film={film} index={i + 1} size="lg" />
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-[0.18em] text-cream/70">{film.category}</p>
                <h3 className="mb-2 font-display text-[22px] font-semibold leading-tight tracking-[-0.03em]">{film.title}</h3>
                <p className="text-[15px] text-cream/75">{film.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
