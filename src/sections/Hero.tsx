import { Link } from 'react-router-dom'
import { HERO_FILMS, type Film } from '../config/portfolio'
import { PROCESS } from '../config/services'
import { SITE } from '../config/site'
import { CONSULTATION } from '../../shared/config/consultation'
import { FilmCard } from '../components/FilmCard'
import { ArrowRight, Star } from '../components/Icons'

export function Hero({ onOpenFilm }: { onOpenFilm: (film: Film) => void }) {
  return (
    <section id="top" aria-labelledby="hero-title" className="px-2 pt-3 sm:px-3 lg:px-4">
      <div className="overflow-hidden rounded-[24px] bg-espresso text-cream sm:rounded-[32px]">
        <div className="container-page flex flex-col items-stretch gap-12 py-12 sm:py-16 lg:flex-row lg:items-center lg:gap-16 lg:py-22">
          {/* Copy */}
          <div className="flex min-w-0 flex-1 flex-col gap-7 lg:max-w-[600px]">
            <p className="inline-flex items-center gap-2 self-start rounded-full border border-cream/25 px-3.5 py-2 text-[13px] font-medium text-cream/85">
              <Star /> {SITE.tagline}
            </p>
            <h1 id="hero-title" className="font-display text-[clamp(40px,4.6vw,68px)] font-semibold leading-[1.04] tracking-[-0.04em]">
              AI ad films that make brands stand out.
            </h1>
            <p className="max-w-[500px] text-lg leading-relaxed text-cream/80 sm:text-[19px]">
              Powerful brand stories, brought to life as cinematic AI films — in less time, within a smaller budget.
            </p>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4 pt-2">
              <Link to="/#contact" className="btn-light min-h-16 px-9 text-[17px] font-semibold">
                Start a Project <ArrowRight />
              </Link>
              <Link to="/#work" className="inline-flex min-h-11 items-center border-b border-cream/60 font-medium hover:opacity-80">
                Explore Our Work
              </Link>
            </div>
            <p className="-mt-2 text-sm text-cream/75">
              Not sure yet?{' '}
              <Link to="/#consultation" className="font-medium text-cream underline-offset-4 hover:underline">
                Book a ₹{CONSULTATION.feeInr} consultation →
              </Link>
            </p>
            <ol aria-label="How we work" className="mt-2 grid grid-cols-3 gap-4 border-t border-cream/15 pt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-4">
              {PROCESS.map((p, i) => (
                <li key={p.step} className="flex items-center gap-6 [&>svg]:hidden sm:[&>svg]:block">
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs tabular-nums text-cream/70">0{i + 1}</span>
                    <span className="font-display text-[15px] font-semibold tracking-[-0.02em] sm:text-xl">{p.step}</span>
                    <span className="text-[13px] text-cream/70">{p.detail}</span>
                  </span>
                  {i < PROCESS.length - 1 && <ArrowRight size={18} className="text-cream/45" />}
                </li>
              ))}
            </ol>
          </div>

          {/* Film wall: one slow column of 16:9 films */}
          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <div className="film-wall relative h-[420px] overflow-hidden sm:h-[520px] lg:h-[600px]">
              <div className="film-track flex flex-col gap-[18px] pb-[18px]">
                {[...HERO_FILMS, ...HERO_FILMS].map((film, i) => (
                  <FilmCard
                    key={`${film.id}-${i}`}
                    film={film}
                    index={i}
                    onOpen={onOpenFilm}
                    decorative={i >= HERO_FILMS.length}
                  />
                ))}
              </div>
            </div>
            {HERO_FILMS.some((f) => f.placeholder) && (
              <p className="text-center text-xs text-cream/70">Placeholder clips · tap any clip to play</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
