import type { ReactNode } from 'react'
import { SITE } from '../config/site'
import { useDocumentTitle } from '../lib/useDocumentTitle'

interface Props {
  title: string
  intro?: string
  children: ReactNode
}

/** Shared frame for the Privacy Policy, Refund Policy and Terms pages. */
export function LegalLayout({ title, intro, children }: Props) {
  useDocumentTitle(title)
  return (
    <main id="main" className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-[760px]">
        <p className="eyebrow text-espresso/70">Legal</p>
        <h1 className="mt-4 font-display text-[clamp(34px,4vw,52px)] font-semibold leading-[1.06] tracking-[-0.03em]">
          {title}
        </h1>
        <p className="mt-4 text-sm text-espresso/70">Last updated: {SITE.legal.lastUpdated}</p>
        {intro && <p className="mt-8 text-lg leading-8 text-espresso/85">{intro}</p>}
        <div className="legal mt-6">{children}</div>
      </div>
    </main>
  )
}
