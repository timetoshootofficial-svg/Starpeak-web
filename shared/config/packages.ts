/**
 * Advertising film packages.
 *
 * Edit names, prices, durations and deliverables here. The site's pricing
 * cards, the project inquiry form and the server-side payment checks all read
 * from this file. Prices are in Indian Rupees (whole rupees).
 *
 * If you change a price, also update the `package_price` check constraint in
 * supabase/migrations so the database accepts the new amount.
 */

export type PackageId = 'starter' | 'brand-story' | 'brand-growth'

export interface IncludeGroup {
  title: string
  items: string[]
}

export interface FilmPackage {
  id: PackageId
  name: string
  priceInr: number
  duration: string
  description: string
  /** Simple list of deliverables (used when `groups` is not set). */
  includes: string[]
  /** Optional grouped deliverables, shown with group headings. */
  groups?: IncludeGroup[]
  /** Small print shown inside the card. */
  note?: string
  cta: string
  /** Visually emphasised card (dark). No badge is shown. */
  emphasis?: boolean
}

export const PACKAGES: FilmPackage[] = [
  {
    id: 'starter',
    name: 'Starter Ad Film',
    priceInr: 20000,
    duration: 'Up to 3 minutes',
    description:
      'A focused AI ad film that introduces your brand, product or service through cinematic storytelling. For small businesses ready for a professional film.',
    includes: [
      'Basic brand understanding',
      'Creative advertising idea',
      'Short advertising script',
      'AI ad film production',
      'Professional editing',
      'Music and colour grading',
      'One main advertising film',
      'Two revision rounds',
    ],
    cta: 'Start Your Project',
  },
  {
    id: 'brand-story',
    name: 'Brand Story Film',
    priceInr: 35000,
    duration: 'Up to 5 minutes',
    description:
      'We visit your business, meet the owner, and write a story only for your brand, then bring it to life as a cinematic AI film.',
    includes: [
      'Direct brand or business visit',
      'In-person discussion with the brand owner',
      'Brand discovery',
      'Creative ideation',
      'Brand-specific story development',
      'Scriptwriting',
      'Creative direction',
      'AI scene creation',
      'Cinematic editing',
      'Colour grading',
      'One main brand film',
      'Two revision rounds',
    ],
    cta: 'Discuss Your Brand',
  },
  {
    id: 'brand-growth',
    name: 'Brand Growth Film',
    priceInr: 49000,
    duration: 'Up to 8 minutes',
    description:
      'More than a film. An AI brand film, a campaign concept, and a practical 30-day plan to draw customer attention and enquiries.',
    includes: [],
    groups: [
      {
        title: 'The Film',
        items: [
          'Direct brand visit',
          'Detailed brand discovery',
          'In-person brand discussion',
          'Brand-specific story development',
          'Creative direction and scriptwriting',
          'Cinematic AI production',
          'One main advertising film',
          'Three short promotional cuts',
          'Two revision rounds',
        ],
      },
      {
        title: 'Campaign Support',
        items: [
          'Brand-specific campaign concept',
          'Offline customer attraction strategy',
          'QR code or WhatsApp enquiry flow plan',
          'Local promotion strategy',
          'Customer engagement ideas',
          '30-day campaign action plan',
        ],
      },
    ],
    note:
      'Results are not guaranteed. Campaign performance depends on your offer, product quality, pricing, location, audience and execution.',
    cta: 'Build My Brand Campaign',
    emphasis: true,
  },
]

export const PRICING_NOTE =
  'Final production scope, shooting requirements, deliverables, and project timeline will be confirmed after discussing your brief.'

export function getPackage(id: string): FilmPackage | undefined {
  return PACKAGES.find((p) => p.id === id)
}

export function getPackageByName(name: string): FilmPackage | undefined {
  return PACKAGES.find((p) => p.name === name)
}

export function formatInr(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}
