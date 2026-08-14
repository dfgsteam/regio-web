import type { Event, EventProvider, EventCategory } from './types'
import { MockEventProvider } from './mock'

export const GOOGLE_CALENDAR_ICS_URL =
  'https://calendar.google.com/calendar/ical/smj-wegweiser.de_n1ki1l9dhltoli9ddplreovu44%40group.calendar.google.com/public/basic.ics'

export class ICalEventProvider implements EventProvider {
  private fallbackProvider = new MockEventProvider()
  private cache: Event[] | null = null

  async getEvents(): Promise<Event[]> {
    if (this.cache) return this.cache

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(GOOGLE_CALENDAR_ICS_URL, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`)
      }

      const icsText = await res.text()
      const parsed = parseIcsFeed(icsText)

      if (parsed.length > 0) {
        this.cache = parsed
        return parsed
      }
    } catch (e) {
      console.warn('[ICalEventProvider] Failed to fetch live calendar feed, using fallback mock data:', e)
    }

    this.cache = await this.fallbackProvider.getEvents()
    return this.cache
  }

  async getEvent(id: string): Promise<Event | null> {
    const events = await this.getEvents()
    return events.find((e) => e.id === id || e.slug === id) ?? null
  }
}

/**
 * Parses raw iCalendar text into strongly typed Event models.
 */
export function parseIcsFeed(ics: string): Event[] {
  // Unfold folded lines (RFC 5545)
  const unfolded = ics.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const events: Event[] = []
  let inEvent = false
  let current: Record<string, string> = {}

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      current = {}
      continue
    }

    if (line === 'END:VEVENT') {
      inEvent = false
      const event = transformVEvent(current)
      if (event) events.push(event)
      continue
    }

    if (inEvent) {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0) {
        const rawKey = line.substring(0, colonIdx)
        const val = line.substring(colonIdx + 1)
        const key = rawKey.split(';')[0]?.toUpperCase() ?? ''
        current[key] = val
        if (rawKey.includes('VALUE=DATE')) {
          current[key + '_IS_DATE'] = 'true'
        }
      }
    }
  }

  return events
}

function transformVEvent(raw: Record<string, string>): Event | null {
  const summary = decodeIcsText(raw['SUMMARY'] || '').trim()
  if (!summary) return null

  // Skip cancelled events
  if (summary.toUpperCase().includes('ABGESAGT') || summary.includes('[Abgesagt]')) {
    return null
  }

  const start = parseIcsDate(raw['DTSTART'], raw['DTSTART_IS_DATE'] === 'true')
  if (!start) return null
  const parsedEnd = parseIcsDate(raw['DTEND'], raw['DTEND_IS_DATE'] === 'true')
  const end = parsedEnd ?? start

  const rawLocation = decodeIcsText(raw['LOCATION'] || '').trim()
  const rawDesc = decodeIcsText(raw['DESCRIPTION'] || '').trim()
  const cleanDesc = stripHtml(rawDesc)

  // Extract CiviCRM or external registration link from description
  const regUrlMatch = rawDesc.match(/https?:\/\/[^\s"'<>]+/i)
  const registrationUrl = regUrlMatch ? regUrlMatch[0].replace(/&amp;/g, '&') : undefined

  // Determine category & template defaults
  const normalizedTitle = summary.toLowerCase()
  let category: EventCategory = 'general'
  let ageMin: number | undefined
  let ageMax: number | undefined
  let price: string | undefined
  let highlights: string[] | undefined
  let packingList: string[] | undefined
  let location = rawLocation || 'Region Wegweiser'
  let address = rawLocation
  let contactName = 'SMJ Regio Wegweiser'
  let contactRole = 'Lager- & Eventleitung'
  let contactEmail = 'kontakt@smj-wegweiser.de'

  if (normalizedTitle.includes('actionwochenende') || normalizedTitle.includes('actionwoche')) {
    category = 'weekend'
    ageMin = 9
    ageMax = 15
    price = '35 € (inkl. Vollverpflegung, Übernachtung & Material)'
    location = rawLocation || 'Klause 2.0, Heiligenstadt'
    address = 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt'
    contactName = 'Jonathan & Vinzenz'
    contactRole = 'Diözesanleitung'
    contactEmail = 'vinzenz.hupe@smj-wegweiser.de'
    highlights = [
      'Spannende Aktionen & Geländespiele im Wald',
      'Gemeinsames Kochen & Küchencrew',
      'Gemütliche Abende am Kamin & Lagerfeuer',
      '100% handyfreie Zeit – echte Gemeinschaft',
    ]
    packingList = [
      'Persönliche Sachen, Hausschuhe & Kulturbeutel',
      'Krankenkassenkarte & Impfausweis',
      'Wetterfeste Abenteuerkleidung & feste Schuhe (für draußen)',
      'Schlafsack oder Bettbezug und Bettlaken (Leihgebühr: 5 €)',
      'Taschenlampe oder Kopflampe',
    ]
  } else if (normalizedTitle.includes('sterntreffen')) {
    category = 'special'
    ageMin = 15
    ageMax = 25
    price = '35 € (inkl. Vollverpflegung & Programm)'
    contactName = 'Jonathan Hunold'
    contactRole = '2. Diözesanleiter'
    contactEmail = 'jonathan.hunold@smj-wegweiser.de'
    highlights = [
      'Zukunftswerkstatt & Regionalkonferenz',
      'Leitungs- & Gruppenleiter-Impulse',
      'Lange Kaminabende & ehrlicher Austausch',
      'Gottesdienst & Gemeinschaft',
    ]
    packingList = [
      'Schlafsack & Hausschuhe',
      'Kleidung für drinnen und draußen',
      'Notizbuch / Schreibzeug',
      'Musikinstrumente (falls vorhanden)',
      'Krankenkassenkarte',
    ]
  } else if (normalizedTitle.includes('zeltlager')) {
    category = 'camp'
    ageMin = 9
    ageMax = 14
    location = 'Zeltplatz Wiesental, Thalwenden'
    address = 'Birkenfelder Str., 37318 Uder-Thalwenden'
  }

  // Create clean, unique slug
  const year = start.getFullYear()
  const cleanTitle = summary
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const slug = `${cleanTitle}-${year}`
  const id = raw['UID'] || slug

  // Build authentic description
  let description = cleanDesc
  if (!description || description.length < 20) {
    if (category === 'weekend') {
      description = `Wenn die Feiertage vorbei sind und der Winter richtig angekommen ist, wird es Zeit für etwas, worauf man sich freuen kann: ein Wochenende voller Action, Spaß und echter Gemeinschaft!\n\nZusammen erleben wir spannende Aktionen, lustige Spiele, gemeinsames Kochen, gemütliche Abende und jede Menge Abenteuer. Raus aus dem Alltag, rein ins Erlebnis – genau der richtige Neustart.\n\nP.S.: Bring gern einen Freund mit – gemeinsam macht's noch mehr Spaß!`
    } else {
      description = `Herzliche Einladung zu ${summary} der SMJ Regio Wegweiser!`
    }
  }

  return {
    id,
    title: summary,
    slug,
    start,
    end,
    location,
    address,
    ageMin,
    ageMax,
    price,
    teaser: cleanDesc.length > 0 ? cleanDesc.slice(0, 160) + (cleanDesc.length > 160 ? '...' : '') : undefined,
    description,
    highlights,
    packingList,
    registrationUrl,
    category,
    contact: {
      name: contactName,
      role: contactRole,
      email: contactEmail,
    },
  }
}

function decodeIcsText(str: string): string {
  return str
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
}

function parseIcsDate(rawDate?: string, isDateOnly = false): Date | null {
  if (!rawDate) return null
  const cleaned = rawDate.replace(/[^0-9TZ]/g, '')

  if (isDateOnly || cleaned.length === 8) {
    const y = parseInt(cleaned.substring(0, 4), 10)
    const m = parseInt(cleaned.substring(4, 6), 10) - 1
    const d = parseInt(cleaned.substring(6, 8), 10)
    return new Date(y, m, d, 9, 0, 0)
  }

  // Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const y = parseInt(cleaned.substring(0, 4), 10)
  const m = parseInt(cleaned.substring(4, 6), 10) - 1
  const d = parseInt(cleaned.substring(6, 8), 10)
  const h = parseInt(cleaned.substring(9, 11) || '0', 10)
  const min = parseInt(cleaned.substring(11, 13) || '0', 10)
  const s = parseInt(cleaned.substring(13, 15) || '0', 10)

  if (cleaned.endsWith('Z')) {
    return new Date(Date.UTC(y, m, d, h, min, s))
  }
  return new Date(y, m, d, h, min, s)
}
