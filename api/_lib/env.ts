/**
 * Server-only configuration. These values come from Vercel environment
 * variables and are never sent to the browser (except the Razorpay key ID,
 * which Razorpay designs to be public).
 */
export interface ServerEnv {
  supabaseUrl: string
  supabaseServiceRoleKey: string
  razorpayKeyId: string
  razorpayKeySecret: string
  razorpayWebhookSecret: string
  resendApiKey: string
  emailFrom: string
  studioNotifyEmail: string
  siteUrl: string
}

function read(name: string): string {
  return (process.env[name] || '').trim()
}

export function env(): ServerEnv {
  return {
    supabaseUrl: read('SUPABASE_URL'),
    supabaseServiceRoleKey: read('SUPABASE_SERVICE_ROLE_KEY'),
    razorpayKeyId: read('RAZORPAY_KEY_ID'),
    razorpayKeySecret: read('RAZORPAY_KEY_SECRET'),
    razorpayWebhookSecret: read('RAZORPAY_WEBHOOK_SECRET'),
    resendApiKey: read('RESEND_API_KEY'),
    emailFrom: read('EMAIL_FROM'),
    studioNotifyEmail: read('STUDIO_NOTIFY_EMAIL'),
    siteUrl: read('SITE_URL').replace(/\/$/, ''),
  }
}

export function databaseConfigured(e = env()): boolean {
  return !!(e.supabaseUrl && e.supabaseServiceRoleKey)
}

export function paymentsConfigured(e = env()): boolean {
  return databaseConfigured(e) && !!(e.razorpayKeyId && e.razorpayKeySecret)
}

export function emailConfigured(e = env()): boolean {
  return !!(e.resendApiKey && e.emailFrom)
}
