'use client'

import type { Film } from '@/config/portfolio'
import { Play } from './Icons'
import { useOpenFilm } from './FilmPlayer'

const TONES = ['tone-1', 'tone-3', 'tone-2', 'tone-4']

interface Props {
  film: Film
  index: number
  /** Duplicated cards in the looping wall are hidden from screen readers and Tab. */
  decorative?: boolean
  size?: 'sm' | 'lg'
}

/** A 16:9 clickable film thumbnail. Shows the poster or muted preview when available. */
export function FilmCard({ film, index, decorative = false, size = 'sm' }: Props) {
  const onOpen = useOpenFilm()
  const tone = TONES[index % TONES.length]
  return (
    <button
      type="button"
      onClick={() => onOpen(film)}
      aria-label={`Play ${film.title}, ${film.category}`}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      className={`group relative block aspect-video w-full overflow-hidden rounded-[18px] border border-cream/15 text-left text-cream transition-colors hover:border-cream/55 focus-visible:border-cream ${film.poster || film.previewSrc ? 'bg-espresso' : tone}`}
    >
      {film.previewSrc ? (
        <video
          src={film.previewSrc}
          poster={film.poster}
          muted
          loop
          autoPlay
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : film.poster ? (
        <img src={film.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <span
        aria-hidden="true"
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cream/45 bg-cream/12 transition-transform group-hover:scale-105 ${size === 'lg' ? 'h-16 w-16' : 'h-11 w-11'}`}
      >
        <Play size={size === 'lg' ? 18 : 13} />
      </span>
      {size === 'sm' && (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-espresso/90 to-espresso/0 px-3 pb-2.5 pt-5 text-[11px] font-medium uppercase tracking-[0.12em] text-cream/85">
          <span>{film.category}</span>
          {film.placeholder && <span>Placeholder</span>}
        </span>
      )}
    </button>
  )
}
