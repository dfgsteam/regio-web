import type { APIRoute } from 'astro'
import { eventProvider } from '../../lib/events'

export const prerender = false

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

export const GET: APIRoute = async () => {
  const events = await eventProvider.getEvents()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SMJ Regio Wegweiser//Terminkalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SMJ Regio Wegweiser Termine',
    'X-WR-TIMEZONE:Europe/Berlin',
    'X-WR-CALDESC:Offizielle Termine, Zeltlager und Wochenenden der SMJ Regio Wegweiser',
  ]

  for (const event of events) {
    const uid = `${event.id}@smj-wegweiser.de`
    const dtstamp = formatIcsDate(new Date())
    const dtstart = formatIcsDate(event.start)
    const dtend = formatIcsDate(event.end)
    const summary = event.title.replace(/\n/g, ' ')
    const description = (event.teaser || event.description || '').replace(/\n/g, '\\n')
    const location = (event.location || 'Wiesenthal bei Thalwenden').replace(/\n/g, ' ')

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="smj-wegweiser-termine.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
