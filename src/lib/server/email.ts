import { emailConfigured, env } from './env'

/**
 * Optional transactional email through Resend (https://resend.com/docs/api-reference/emails/send-email).
 * When RESEND_API_KEY / EMAIL_FROM are not set, emails are skipped and the
 * site shows the booking details on screen instead. Failures never block a booking.
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const e = env()
  if (!emailConfigured(e) || !to) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${e.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: e.emailFrom, to: [to], subject, text }),
    })
    if (!res.ok) console.error('[email] send failed', res.status, await res.text().catch(() => ''))
    return res.ok
  } catch (err) {
    console.error('[email] send error', err)
    return false
  }
}

export async function notifyStudio(subject: string, text: string): Promise<void> {
  const e = env()
  if (e.studioNotifyEmail) await sendEmail(e.studioNotifyEmail, subject, text)
}
