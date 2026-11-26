import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { ProjectPayment } from './pages/ProjectPayment'
import { NotFound } from './pages/NotFound'
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy'
import { RefundPolicy } from './pages/legal/RefundPolicy'
import { Terms } from './pages/legal/Terms'

/** Scrolls to #section links (also across routes) and to the top on page change. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      // Wait briefly so the target has rendered and the mobile menu has closed
      // (its collapse would otherwise interrupt the scroll).
      const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 60)
      return () => window.clearTimeout(t)
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pay/:reference" element={<ProjectPayment />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  )
}
