import type { Metadata } from 'next'
import { Terms } from '@/legal/Terms'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  alternates: { canonical: '/terms' },
}

export default function Page() {
  return <Terms />
}
