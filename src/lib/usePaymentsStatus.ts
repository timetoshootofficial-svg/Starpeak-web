import { useEffect, useState } from 'react'

interface Status {
  loading: boolean
  /** True when the server has Razorpay and Supabase configured. */
  enabled: boolean
}

let cached: Promise<boolean> | null = null

function fetchStatus(): Promise<boolean> {
  if (!cached) {
    cached = fetch('/api/status')
      .then((r) => (r.ok ? r.json() : { payments: false }))
      .then((b: { payments?: boolean }) => b.payments === true)
      .catch(() => false)
  }
  return cached
}

/** Whether online payments are switched on. Booking buttons stay disabled until they are. */
export function usePaymentsStatus(): Status {
  const [status, setStatus] = useState<Status>({ loading: true, enabled: false })
  useEffect(() => {
    let alive = true
    fetchStatus().then((enabled) => alive && setStatus({ loading: false, enabled }))
    return () => {
      alive = false
    }
  }, [])
  return status
}
