import type { Metadata } from 'next'
import { PrivacyPolicy } from '@/legal/PrivacyPolicy'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy-policy' },
}

export default function Page() {
  return <PrivacyPolicy />
}
