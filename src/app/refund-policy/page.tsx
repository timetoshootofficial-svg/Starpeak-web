import type { Metadata } from 'next'
import { RefundPolicy } from '@/legal/RefundPolicy'

export const metadata: Metadata = {
  title: 'Refund Policy',
  alternates: { canonical: '/refund-policy' },
}

export default function Page() {
  return <RefundPolicy />
}
