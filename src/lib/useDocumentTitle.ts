import { useEffect } from 'react'
import { SITE } from '../config/site'

/** Sets the browser tab title for a page. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE.name}` : `${SITE.name} — AI Advertising Films`
  }, [title])
}
