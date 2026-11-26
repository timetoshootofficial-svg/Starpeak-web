/**
 * Site-wide settings. Replace every value in [square brackets] with your
 * real details before going live. Nothing here is a secret.
 */
export const SITE = {
  name: 'STARPEAK Media',
  shortName: 'STARPEAK',
  tagline: 'AI Advertising Film Studio',
  description:
    'STARPEAK Media is an AI advertising film studio. We turn brand stories into cinematic AI ad films, in less time and within a smaller budget.',
  /** Public URL of the site, e.g. https://www.starpeakmedia.in (set NEXT_PUBLIC_SITE_URL in Vercel). */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.example.com').replace(/\/$/, ''),
  year: new Date().getFullYear(),

  contact: {
    /** Shown on the site. Leave the brackets until you have a real address. */
    email: '[hello@yourdomain.com]',
    instagramHandle: '[@yourhandle]',
    /** Full Instagram URL. Leave empty to show the handle as plain text. */
    instagramUrl: '',
  },

  /** Used on the Privacy Policy, Refund Policy and Terms pages. */
  legal: {
    entityName: '[Legal business name]',
    address: '[Registered business address]',
    jurisdiction: '[City], India',
    privacyEmail: '[privacy@yourdomain.com]',
    lastUpdated: '26 November 2026',
  },
} as const

export const NAV_LINKS = [
  { label: 'Work', href: '/#work' },
  { label: 'Services', href: '/#services' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
] as const

export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
] as const

/** True while a value still holds a [placeholder]. */
export function isPlaceholder(value: string): boolean {
  return value.startsWith('[') && value.endsWith(']')
}
