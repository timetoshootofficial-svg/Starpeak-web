/**
 * Portfolio films.
 *
 * EASIEST: paste a YouTube or Vimeo link into `videoUrl`. The thumbnail is
 * fetched automatically and the film plays in the site's player when clicked.
 * Any of these work:
 *   https://www.youtube.com/watch?v=…   https://youtu.be/…   https://youtube.com/shorts/…
 *   https://vimeo.com/123456789   https://vimeo.com/123456789/abcdef1234   https://vimeo.com/share/…
 * For unlisted Vimeo videos, keep embedding allowed (Vimeo → video → Share → Embed).
 *
 * Or self-host: put files in /public/videos and /public/posters and use `src`
 * / `poster` (paths start with "/"). Items with no video show as clearly-marked
 * placeholders, so the layout works before your films are ready.
 *
 * Tips for fast loading:
 * - Hero clips: short (6–15 s), muted MP4 (H.264), 1280×720, under ~3 MB each.
 * - Full films: host on your own storage/CDN or keep files reasonably sized.
 * - Always add a poster image (JPG/WebP, 1280×720).
 */

import type { VideoRef } from '@/lib/video'

export interface Film {
  id: string
  title: string
  category: string
  description: string
  /** YouTube or Vimeo link. Takes priority over `src`. */
  videoUrl?: string
  /** Full film with sound, played in the lightbox (self-hosted file). */
  src?: string
  /** Short muted preview used in the hero film wall (optional). */
  previewSrc?: string
  poster?: string
  placeholder: boolean
  /** Filled in automatically from `videoUrl` at build time. Don't set by hand. */
  video?: VideoRef
}

/** Clips that scroll in the hero film wall (16:9). */
export const HERO_FILMS: Film[] = [
  {
    id: 'clip-01',
    title: 'Your Photos Are Still Breathing',
    category: 'Brand Story Film',
    description: '',
    videoUrl: 'https://vimeo.com/share/261068ba-f022-4b38-8cf8-19fad7dbb053',
    placeholder: false,
  },
  { id: 'clip-02', title: '[Clip 02]', category: 'Restaurant', description: '', placeholder: true },
  { id: 'clip-03', title: '[Clip 03]', category: 'Real Estate', description: '', placeholder: true },
  { id: 'clip-04', title: '[Clip 04]', category: 'Fashion', description: '', placeholder: true },
  { id: 'clip-05', title: '[Clip 05]', category: 'Skincare', description: '', placeholder: true },
  { id: 'clip-06', title: '[Clip 06]', category: 'Automobile', description: '', placeholder: true },
  { id: 'clip-07', title: '[Clip 07]', category: 'Education', description: '', placeholder: true },
  { id: 'clip-08', title: '[Clip 08]', category: 'Festival Offer', description: '', placeholder: true },
]

/** "Selected Work" section. The first item is shown large. */
export const SELECTED_WORK: Film[] = [
  {
    id: 'work-01',
    title: '[Project Title 01]',
    category: '[Brand Category]',
    description: '[One-line description of the film and the brand idea behind it.]',
    placeholder: true,
  },
  {
    id: 'work-02',
    title: '[Project Title 02]',
    category: '[Brand Category]',
    description: '[Short description of the advertising film.]',
    placeholder: true,
  },
  {
    id: 'work-03',
    title: '[Project Title 03]',
    category: '[Brand Category]',
    description: '[Short description of the advertising film.]',
    placeholder: true,
  },
]
