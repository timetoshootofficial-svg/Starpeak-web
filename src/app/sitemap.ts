import type { MetadataRoute } from 'next'
import { SITE } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '', priority: 1 },
    { path: '/privacy-policy', priority: 0.3 },
    { path: '/refund-policy', priority: 0.3 },
    { path: '/terms', priority: 0.3 },
  ]
  return pages.map((p) => ({ url: `${SITE.url}${p.path}`, priority: p.priority }))
}
