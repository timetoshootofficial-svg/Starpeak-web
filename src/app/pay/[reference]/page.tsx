import type { Metadata } from 'next'
import { ProjectPayment } from '@/components/ProjectPayment'

// Private payment links must never appear in search results.
export const metadata: Metadata = {
  title: 'Project Payment',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ProjectPayment />
}
