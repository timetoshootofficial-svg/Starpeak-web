import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-start justify-center gap-6 py-24">
      <p className="eyebrow text-espresso/70">404</p>
      <h1 className="heading-xl">This page doesn't exist.</h1>
      <Link to="/" className="btn-dark">Back to home</Link>
    </main>
  )
}
