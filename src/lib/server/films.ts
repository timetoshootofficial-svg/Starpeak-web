import 'server-only'
import type { Film } from '@/config/portfolio'
import { parseVideoUrl, youtubeThumbnail, type VideoRef } from '@/lib/video'

const DAY = 60 * 60 * 24

/** vimeo.com/share/… links don't contain the video id, so read it from the share page. */
async function resolveVimeoShare(url: string): Promise<VideoRef | null> {
  try {
    const res = await fetch(url, { next: { revalidate: DAY } })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/player\.vimeo\.com\/video\/(\d+)(?:\?h=([0-9a-f]+))?/i)
    return m ? { provider: 'vimeo', id: m[1], hash: m[2] } : null
  } catch {
    return null
  }
}

async function vimeoThumbnail(video: Extract<VideoRef, { provider: 'vimeo' }>): Promise<string | undefined> {
  const page = `https://vimeo.com/${video.id}${video.hash ? `/${video.hash}` : ''}`
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(page)}&width=1280`, {
      next: { revalidate: DAY },
    })
    if (!res.ok) return undefined
    const data = (await res.json()) as { thumbnail_url?: string }
    return data.thumbnail_url
  } catch {
    return undefined
  }
}

async function resolveFilm(film: Film): Promise<Film> {
  if (!film.videoUrl) return film
  let video = parseVideoUrl(film.videoUrl)
  if (!video && /vimeo\.com\/share\//.test(film.videoUrl)) video = await resolveVimeoShare(film.videoUrl)
  if (!video) {
    console.warn(`[films] Could not read the video link for "${film.id}": ${film.videoUrl}`)
    return film
  }
  let poster = film.poster
  if (!poster) poster = video.provider === 'youtube' ? youtubeThumbnail(video.id) : await vimeoThumbnail(video)
  return { ...film, video, poster }
}

/**
 * Resolves every film's YouTube/Vimeo link at build time (refreshed daily),
 * so visitors get plain thumbnails and the player loads only when they click.
 */
export function resolveFilms(films: Film[]): Promise<Film[]> {
  return Promise.all(films.map(resolveFilm))
}
