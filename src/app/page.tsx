import { Suspense } from 'react'
import { FilmPlayerProvider } from '@/components/FilmPlayer'
import { Hero } from '@/sections/Hero'
import { WhyAi } from '@/sections/WhyAi'
import { SelectedWork } from '@/sections/SelectedWork'
import { Services } from '@/sections/Services'
import { Pricing } from '@/sections/Pricing'
import { Consultation } from '@/sections/Consultation'
import { About } from '@/sections/About'
import { Contact } from '@/sections/Contact'
import { SITE } from '@/config/site'
import { PACKAGES } from '@/shared/config/packages'

/** Structured data so search engines understand the business and its offers. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  image: `${SITE.url}/og-image.png`,
  areaServed: 'IN',
  makesOffer: PACKAGES.map((p) => ({
    '@type': 'Offer',
    name: p.name,
    price: p.priceInr,
    priceCurrency: 'INR',
  })),
}

export default function HomePage() {
  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FilmPlayerProvider>
        <Hero />
        <WhyAi />
        <SelectedWork />
      </FilmPlayerProvider>
      <Services />
      <Pricing />
      <Consultation />
      <About />
      {/* The inquiry form reads ?package= from the URL, which needs a Suspense boundary. */}
      <Suspense>
        <Contact />
      </Suspense>
    </main>
  )
}
