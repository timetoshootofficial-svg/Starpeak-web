/**
 * Turns a YouTube or Vimeo link into something the site can embed.
 *
 * Supported links:
 *   YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
 *   Vimeo:   vimeo.com/ID, vimeo.com/ID/HASH (unlisted), player.vimeo.com/video/ID?h=HASH
 *            vimeo.com/share/… links are resolved on the server at build time.
 */

export type VideoRef =
  | { provider: 'youtube'; id: string }
  | { provider: 'vimeo'; id: string; hash?: string }

const YT_ID = /^[A-Za-z0-9_-]{11}$/

export function parseVideoUrl(input: string): VideoRef | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\.|^m\./, '')
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be' && YT_ID.test(parts[0] ?? '')) return { provider: 'youtube', id: parts[0] }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v')
    if (v && YT_ID.test(v)) return { provider: 'youtube', id: v }
    if (['shorts', 'embed', 'live'].includes(parts[0] ?? '') && YT_ID.test(parts[1] ?? '')) {
      return { provider: 'youtube', id: parts[1] }
    }
  }

  if (host === 'player.vimeo.com' && parts[0] === 'video' && /^\d+$/.test(parts[1] ?? '')) {
    const h = url.searchParams.get('h') ?? undefined
    return { provider: 'vimeo', id: parts[1], hash: h && /^[0-9a-f]+$/i.test(h) ? h : undefined }
  }
  if (host === 'vimeo.com') {
    const idIndex = parts.findIndex((p) => /^\d+$/.test(p))
    if (idIndex >= 0) {
      const next = parts[idIndex + 1]
      const h = url.searchParams.get('h') ?? (next && /^[0-9a-f]{6,}$/i.test(next) ? next : undefined)
      return { provider: 'vimeo', id: parts[idIndex], hash: h ?? undefined }
    }
  }
  return null
}

/** Player URL for the lightbox. Autoplays with sound after the visitor's click. */
export function embedUrl(video: VideoRef): string {
  if (video.provider === 'youtube') {
    const q = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1' })
    return `https://www.youtube-nocookie.com/embed/${video.id}?${q}`
  }
  const q = new URLSearchParams({ autoplay: '1', title: '0', byline: '0', portrait: '0', dnt: '1' })
  if (video.hash) q.set('h', video.hash)
  return `https://player.vimeo.com/video/${video.id}?${q}`
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}
