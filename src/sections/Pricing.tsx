import { Link } from 'react-router-dom'
import { PACKAGES, PRICING_NOTE, formatInr, type FilmPackage } from '../../shared/config/packages'
import { Check } from '../components/Icons'

function Includes({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="flex flex-col gap-2.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <Check className={`mt-1 shrink-0 ${dark ? 'text-cream' : 'text-espresso'}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function PackageCard({ pkg }: { pkg: FilmPackage }) {
  const dark = !!pkg.emphasis
  return (
    <article
      aria-labelledby={`pkg-${pkg.id}`}
      className={`flex flex-col gap-6 rounded-2xl border p-8 sm:p-9 ${dark ? 'border-espresso bg-espresso text-cream' : 'border-espresso/15'}`}
    >
      <div className="flex flex-col gap-2.5">
        <h3 id={`pkg-${pkg.id}`} className="text-[13px] font-semibold uppercase tracking-[0.18em]">{pkg.name}</h3>
        <p className="font-display text-[46px] font-semibold leading-none tracking-[-0.03em]">{formatInr(pkg.priceInr)}</p>
        <p className={`text-sm ${dark ? 'text-cream/75' : 'text-espresso/75'}`}>Film duration · {pkg.duration}</p>
      </div>
      <p className={`text-[15px] ${dark ? 'text-cream/85' : 'text-espresso/85'}`}>{pkg.description}</p>

      {pkg.groups ? (
        pkg.groups.map((g) => (
          <div key={g.title} className={`flex flex-col gap-3 border-t pt-5 ${dark ? 'border-cream/20' : 'border-espresso/15'}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${dark ? 'text-cream/75' : 'text-espresso/75'}`}>{g.title}</p>
            <Includes items={g.items} dark={dark} />
          </div>
        ))
      ) : (
        <div className={`border-t pt-5 ${dark ? 'border-cream/20' : 'border-espresso/15'}`}>
          <Includes items={pkg.includes} dark={dark} />
        </div>
      )}

      {pkg.note && <p className={`text-xs leading-relaxed ${dark ? 'text-cream/75' : 'text-espresso/75'}`}>{pkg.note}</p>}

      <Link
        to={`/?package=${pkg.id}#contact`}
        className={`mt-auto w-full ${dark ? 'btn-light' : 'btn-outline'}`}
      >
        {pkg.cta}
      </Link>
    </article>
  )
}

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="pb-18 sm:pb-28">
      <div className="container-page flex flex-col gap-14">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-espresso/15 pt-16 sm:pt-24">
          <div className="flex flex-col gap-4">
            <p className="eyebrow text-espresso/70">Pricing</p>
            <h2 id="pricing-title" className="heading-xl">Advertising Film Packages</h2>
          </div>
          <p className="max-w-[320px] text-espresso/75">Choose the right creative approach for your brand.</p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>

        <p className="max-w-[760px] text-sm text-espresso/75">
          {PRICING_NOTE} All prices in Indian Rupees. Please read our{' '}
          <Link to="/refund-policy" className="link">Refund Policy</Link> before making a payment.
        </p>
      </div>
    </section>
  )
}
