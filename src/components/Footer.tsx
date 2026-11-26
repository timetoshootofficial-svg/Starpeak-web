import Link from 'next/link'
import { LEGAL_LINKS, SITE } from '@/config/site'

const FOOTER_NAV = [
  { label: 'Work', href: '/#work' },
  { label: 'Services', href: '/#services' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Contact', href: '/#contact' },
]

export function Footer() {
  return (
    <footer className="bg-espresso pb-8 pt-16 text-cream sm:pt-22">
      <div className="container-page flex flex-col gap-14">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex max-w-[340px] flex-col gap-4">
            <img src="/brand/logo-cream.png" alt={SITE.name} width={245} height={44} className="h-11 w-auto self-start" loading="lazy" />
            <p className="text-sm text-cream/70">An AI advertising film studio creating cinematic ad films for brands.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-18 gap-y-10 text-sm">
            <ul className="flex flex-col gap-3">
              {FOOTER_NAV.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:opacity-70">{l.label}</Link></li>
              ))}
            </ul>
            <ul className="flex flex-col gap-3">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:opacity-70">{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-cream/15 pt-6 text-[13px] text-cream/70">
          <span>© {SITE.year} {SITE.name}. All rights reserved.</span>
          <span>Prices in INR · Payments by Razorpay</span>
        </div>
      </div>
    </footer>
  )
}
