import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-start justify-center gap-6 py-24">
      <p className="eyebrow text-espresso/70">404</p>
      <h1 className="heading-xl">This page doesn&apos;t exist.</h1>
      <Link href="/" className="btn-dark">Back to home</Link>
    </main>
  )
}
