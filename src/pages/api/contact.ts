import type { APIRoute } from 'astro'

// Simple in-memory sliding-window rate limit. Fine for a single Node
// instance; swap for a shared store when scaling beyond one process.
const WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS = 5
const attempts = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  const recent = (attempts.get(ip) ?? []).filter((t) => t > windowStart)
  if (recent.length >= MAX_REQUESTS) {
    attempts.set(ip, recent)
    return true
  }
  recent.push(now)
  attempts.set(ip, recent)
  return false
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

const badRequest = (detail: string, extra?: Record<string, string>) =>
  new Response(JSON.stringify({ ok: false, detail, ...extra }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request)
  if (rateLimited(ip)) {
    return new Response(JSON.stringify({ ok: false, detail: 'Zu viele Anfragen. Bitte später erneut versuchen.' }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest('Ungültige Anfrage.')
  }

  // Honeypot: real users never fill this field.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || name.length < 2 || name.length > 120) {
    return badRequest('Bitte gib deinen Namen an.', { field: 'name' })
  }
  if (!isEmail(email)) {
    return badRequest('Bitte gib eine gültige E-Mail-Adresse an.', { field: 'email' })
  }
  if (!message || message.length < 10 || message.length > 4000) {
    return badRequest('Deine Nachricht ist zu kurz oder zu lang.', { field: 'message' })
  }

  const mailHost = import.meta.env.MAIL_HOST as string | undefined
  const mailFrom = (import.meta.env.MAIL_FROM as string) ?? 'no-reply@smj-wegweiser.de'
  const mailTo = (import.meta.env.MAIL_TO as string) ?? mailFrom

  if (!mailHost) {
    // No mail transport configured (dev/staging). Fail open so the
    // site stays usable; log the payload instead.
    console.info('[contact] no MAIL_HOST configured, skipping send', { name, email })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }

  try {
    const { createTransport } = await import('nodemailer')
    const transporter = createTransport({
      host: mailHost,
      port: Number(import.meta.env.MAIL_PORT ?? 587),
      secure: Number(import.meta.env.MAIL_PORT ?? 587) === 465,
      auth: import.meta.env.MAIL_USER
        ? { user: import.meta.env.MAIL_USER, pass: import.meta.env.MAIL_PASSWORD }
        : undefined,
    })

    await transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      replyTo: email,
      subject: `Kontaktanfrage von ${name}`,
      text: `Name: ${name}\nE-Mail: ${email}\n\n${message}`,
    })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (error) {
    console.error('[contact] mail transport failed', error)
    return new Response(JSON.stringify({ ok: false, detail: 'Die Nachricht konnte gerade nicht gesendet werden. Bitte schreibe uns direkt: kontakt@smj-wegweiser.de' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
