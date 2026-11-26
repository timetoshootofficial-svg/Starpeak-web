import { useState } from 'react'
import type { Film } from '../config/portfolio'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { VideoLightbox } from '../components/VideoLightbox'
import { Hero } from '../sections/Hero'
import { WhyAi } from '../sections/WhyAi'
import { SelectedWork } from '../sections/SelectedWork'
import { Services } from '../sections/Services'
import { Pricing } from '../sections/Pricing'
import { Consultation } from '../sections/Consultation'
import { About } from '../sections/About'
import { Contact } from '../sections/Contact'

export function Home() {
  useDocumentTitle()
  const [film, setFilm] = useState<Film | null>(null)
  return (
    <main id="main">
      <Hero onOpenFilm={setFilm} />
      <WhyAi />
      <SelectedWork onOpenFilm={setFilm} />
      <Services />
      <Pricing />
      <Consultation />
      <About />
      <Contact />
      <VideoLightbox film={film} onClose={() => setFilm(null)} />
    </main>
  )
}
