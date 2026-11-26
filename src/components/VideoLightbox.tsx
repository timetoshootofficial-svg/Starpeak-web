import { useEffect, useRef } from 'react'
import type { Film } from '../config/portfolio'
import { Close, Play } from './Icons'

interface Props {
  film: Film | null
  onClose: () => void
}

/**
 * Full-screen film player. Uses the native <dialog> element, which handles
 * focus trapping and the Escape key. Audio only plays after the person clicks.
 */
export function VideoLightbox({ film, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (film && !dialog.open) dialog.showModal()
    if (!film && dialog.open) dialog.close()
  }, [film])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={film ? `${film.title} — ${film.category}` : 'Film player'}
      className="m-auto w-[min(960px,calc(100vw-32px))] max-w-none bg-transparent p-0 text-cream backdrop:bg-espresso/95"
    >
      {film && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cream/75">
              {film.category}
              {film.placeholder && ' · Placeholder'}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close film"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/40 hover:border-cream"
            >
              <Close />
            </button>
          </div>
          {film.src ? (
            <video
              key={film.src}
              src={film.src}
              poster={film.poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="aspect-video w-full rounded-2xl bg-espresso"
            />
          ) : (
            <div className="tone-2 flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-cream/20">
              <span className="flex h-18 w-18 items-center justify-center rounded-full bg-cream text-espresso">
                <Play size={22} />
              </span>
              <span className="text-sm text-cream/75">Your film will play here once it is added.</span>
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
