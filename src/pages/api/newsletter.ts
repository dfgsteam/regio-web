import type { APIRoute } from 'astro'

export const prerender = false

const badRequest = (detail: string, extra?: Record<string, string>) =>
  new Response(JSON.stringify({ ok: false, detail, ...extra }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest('Ungültige Anfrage.')
  }

  // Honeypot field
  if (typeof body.website === 'string' && body.website.length > 0) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return badRequest('Bitte gib eine gültige E-Mail-Adresse ein.', { field: 'email' })
  }

  console.info('[newsletter] new subscription request', { email, timestamp: new Date().toISOString() })

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'Vielen Dank! Du bist jetzt für den Wegweiser-Newsletter eingetragen.',
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  )
}
