'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, SITE } from '@/config/site'
import { Close, Menu } from './Icons'

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile menu when the page changes.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  // …and on hash navigation or Escape.
  useEffect(() => {
    const close = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('hashchange', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('hashchange', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-espresso/10 bg-cream/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-espresso focus:px-4 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <nav aria-label="Main" className="container-page flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center" aria-label={`${SITE.name} home`} onClick={close}>
          {/* Small static logo: a plain <img> keeps it simple and sharp. */}
          <img src="/brand/logo-espresso.png" alt={SITE.name} width={190} height={34} className="h-[30px] w-auto sm:h-[34px]" />
        </Link>

        <ul className="hidden items-center gap-9 text-sm lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:opacity-70">{l.label}</Link>
            </li>
          ))}
        </ul>

        <Link href="/#contact" className="btn-dark hidden min-h-11 px-6 text-sm lg:inline-flex">
          Start a Project
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-espresso/20 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-espresso/10 bg-cream lg:hidden">
          <ul className="container-page flex flex-col py-4">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className="block border-b border-espresso/10 py-4 font-display text-xl font-semibold tracking-tight">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-5">
              <Link href="/#contact" onClick={close} className="btn-dark w-full">Start a Project</Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
