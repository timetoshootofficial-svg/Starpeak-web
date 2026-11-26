/**
 * Portfolio films.
 *
 * Put video files in /public/videos and poster images in /public/posters,
 * then fill in `src` and `poster` below (paths start with "/"). Items without
 * a `src` show as clearly-marked placeholders, so the layout works before your
 * films are ready.
 *
 * Tips for fast loading:
 * - Hero clips: short (6–15 s), muted MP4 (H.264), 1280×720, under ~3 MB each.
 * - Full films: host on your own storage/CDN or keep files reasonably sized.
 * - Always add a poster image (JPG/WebP, 1280×720).
 */

export interface Film {
  id: string
  title: string
  category: string
  description: string
  /** Full film with sound, played in the lightbox. */
  src?: string
  /** Short muted preview used in the hero film wall (optional). */
  previewSrc?: string
  poster?: string
  placeholder: boolean
}

/** Clips that scroll in the hero film wall (16:9). */
export const HERO_FILMS: Film[] = [
  { id: 'clip-01', title: '[Clip 01]', category: 'Jewellery', description: '', placeholder: true },
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
