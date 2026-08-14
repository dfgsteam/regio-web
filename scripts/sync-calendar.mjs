#!/usr/bin/env node

/**
 * Calendar Sync Script for SMJ Regio Wegweiser
 * Fetches the Google Calendar / CiviCRM .ics feed, parses all VEVENT entries,
 * normalizes titles, slugs, locations, and descriptions, and writes
 * a clean src/data/events.json file for static build.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const CALENDAR_URL =
  process.env.CALENDAR_ICS_URL ||
  process.env.GOOGLE_CALENDAR_ICS_URL ||
  'https://calendar.google.com/calendar/ical/smj-wegweiser.de_n1ki1l9dhltoli9ddplreovu44%40group.calendar.google.com/public/basic.ics'

const OUTPUT_FILE = path.join(rootDir, 'src', 'data', 'events.json')

function normalizeEventSlug(title, year) {
  const normalizedTitle = title.trim().toLowerCase()

  if (normalizedTitle.includes('zeltlager')) {
    return `zeltlager-${year}`
  }

  if (normalizedTitle.includes('sterntreffen')) {
    return `sterntreffen-${year}`
  }

  let cleaned = normalizedTitle
    .replace(/\bviii\b/g, '8')
    .replace(/\bvii\b/g, '7')
    .replace(/\bvi\b/g, '6')
    .replace(/\biv\b/g, '4')
    .replace(/\bv\b/g, '5')
    .replace(/\biii\b/g, '3')
    .replace(/\bii\b/g, '2')
    .replace(/\bi\b/g, '1')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const yearStr = String(year)
  return cleaned.endsWith(yearStr) ? cleaned : `${cleaned}-${yearStr}`
}

function decodeIcsText(str) {
  return str
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function sanitizeEventDescription(raw) {
  if (!raw) return ''
  return raw
    .replace(/&nbsp;|\u00a0/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/anmeld(ung|en)\s+(unter|hier|auf|per)?[:\s]*https?:\/\/[^\s"'<>]+/gi, '')
    .replace(/anmeld(ung|en)\s+(unter|hier|auf|per)[:\s]*/gi, '')
    .replace(/anmeld(ung|en)[:\s]*/gi, '')
    .replace(/hier\s+gibt'?s\s+infos\s+oder\s+gleich\s+jetzt\s+anmelden!?/gi, '')
    .replace(/jetzt\s+(gleich\s+)?anmelden!?/gi, '')
    .replace(/https?:\/\/[^\s"'<>]+/gi, '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/[:\-–—\s]+$/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
}

function parseIcsDate(rawDate, isDateOnly = false) {
  if (!rawDate) return null
  const cleaned = rawDate.replace(/[^0-9TZ]/g, '')

  if (isDateOnly || cleaned.length === 8) {
    const y = parseInt(cleaned.substring(0, 4), 10)
    const m = parseInt(cleaned.substring(4, 6), 10) - 1
    const d = parseInt(cleaned.substring(6, 8), 10)
    return new Date(y, m, d, 9, 0, 0)
  }

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

function transformVEvent(raw) {
  const summary = decodeIcsText(raw['SUMMARY'] || '').trim()
  if (!summary) return null

  if (summary.toUpperCase().includes('ABGESAGT') || summary.includes('[Abgesagt]')) {
    return null
  }

  const start = parseIcsDate(raw['DTSTART'], raw['DTSTART_IS_DATE'] === 'true')
  if (!start) return null
  const parsedEnd = parseIcsDate(raw['DTEND'], raw['DTEND_IS_DATE'] === 'true')
  const end = parsedEnd ?? start

  const rawLocation = decodeIcsText(raw['LOCATION'] || '').trim()
  const rawDesc = decodeIcsText(raw['DESCRIPTION'] || '').trim()

  const regUrlMatch = rawDesc.match(/https?:\/\/[^\s"'<>]+/i)
  const registrationUrl = regUrlMatch ? regUrlMatch[0].replace(/&amp;/g, '&') : undefined
  const cleanDesc = sanitizeEventDescription(rawDesc)

  const normalizedTitle = summary.toLowerCase()
  let category = 'general'
  let ageMin = undefined
  let ageMax = undefined
  let price = undefined
  let highlights = undefined
  let packingList = undefined
  let location = rawLocation || 'Region Wegweiser'
  let address = rawLocation
  let contactName = 'SMJ Regio Wegweiser'
  let contactRole = 'Lager- & Eventleitung'
  let contactEmail = 'kontakt@smj-wegweiser.de'
  let contactPhone = undefined

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
    category = 'weekend'
    ageMin = 9
    ageMax = 15
    price = '30 € (inkl. Verpflegung, Unterkunft und Betreuung)'
    location = rawLocation || 'Klause 2.0, Heiligenstadt'
    address = 'Pater-Kentenich-Weg 3, 37308 Heilbad Heiligenstadt'
    contactName = 'Jonathan Hunold'
    contactRole = 'Zeltlagerleitung'
    contactEmail = 'zeltlager@smj-wegweiser.de'
    contactPhone = '0179 6353443'
    highlights = [
      'Großes Wiedersehen der Zeltgemeinschaft',
      'Lager-Rückblick, Zeltlagerfotos & wilde Geschichten',
      'Geländespiele & Mutproben rund um die Klause 2.0',
      '100% handyfreie Zeit – echte Gemeinschaft',
    ]
    packingList = [
      'Persönliche Sachen, Hausschuhe & Kulturbeutel',
      'Krankenkassenkarte & Impfausweis',
      'Kleidung für Abenteuer & feste Schuhe (für draußen)',
      'Schlafsack oder Bettbezug und Bettlaken (Leihgebühr: 5 €)',
      'Taschenlampe oder Kopflampe',
    ]
  } else if (normalizedTitle.includes('zeltlager')) {
    category = 'camp'
    ageMin = 9
    ageMax = 14
    location = 'Zeltplatz Wiesental, Thalwenden'
    address = 'Birkenfelder Str., 37318 Uder-Thalwenden'
    highlights = [
      'Zeltdorf im malerischen Wiesental',
      'Nachtwache, Bundesfeuer & Fackelläufe',
      'Großes Lagerspiel nach Motto-Storyline',
      '100% handyfreie Natur- und Gemeinschaftserfahrung',
    ]
    packingList = [
      'Warmer Schlafsack & dicke Isomatte / Luftbett',
      'Wanderstiefel, feste Schuhe & Gummistiefel',
      'Regenfeste Kleidung, warme Jacke & Badesachen',
      'Essgeschirr, Becher & Besteck im Stoffbeutel',
      'Taschenlampe / Kopflampe mit Ersatzbatterien',
      'Krankenkassenkarte & Impfausweis',
    ]
  }

  const year = start.getFullYear()
  const slug = normalizeEventSlug(summary, year)
  const id = raw['UID'] || slug

  let description = cleanDesc
  if (!description || description.length < 15) {
    if (normalizedTitle.includes('sterntreffen')) {
      description = `Das offizielle Nachtreffen für alle Jungs, die im Zeltlager dabei waren! Drei Tage voller Mutproben, Kameradschaft, wilder Lagergeschichten und das große Wiedersehen der Zeltgemeinschaft in der Klause 2.0 in Heiligenstadt.\n\nGemeinsam lassen wir die Erlebnisse des Zeltlagers wieder aufleben, schauen die Zeltlagerfotos an, kochen zusammen und verbringen gemütliche Abende am Kamin und Lagerfeuer.`
    } else if (category === 'weekend') {
      description = `Wenn die Feiertage vorbei sind und der Winter richtig angekommen ist, wird es Zeit für etwas, worauf man sich freuen kann: ein Wochenende voller Action, Spaß und echter Gemeinschaft!\n\nZusammen erleben wir spannende Aktionen, lustige Spiele, gemeinsames Kochen, gemütliche Abende und jede Menge Abenteuer. Raus aus dem Alltag, rein ins Erlebnis – genau der richtige Neustart.\n\nP.S.: Bring gern einen Freund mit – gemeinsam macht's noch mehr Spaß!`
    } else {
      description = `Herzliche Einladung zu ${summary} der SMJ Regio Wegweiser! Alle wichtigen Informationen, Zeiten und Details findest du in der Übersicht.`
    }
  }

  const teaser =
    description.length > 0
      ? description.slice(0, 160) + (description.length > 160 ? '...' : '')
      : undefined

  return {
    id,
    title: summary,
    slug,
    start: start.toISOString(),
    end: end.toISOString(),
    location,
    address,
    ageMin,
    ageMax,
    price,
    teaser,
    description,
    highlights,
    packingList,
    registrationUrl,
    category,
    contact: {
      name: contactName,
      role: contactRole,
      email: contactEmail,
      phone: contactPhone,
    },
  }
}

export function parseIcs(icsText) {
  const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const events = []
  let inEvent = false
  let current = {}

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

  // Disambiguate any duplicate slugs (e.g. two generic events in the same year)
  const slugCounts = new Map()
  for (const ev of events) {
    const count = (slugCounts.get(ev.slug) || 0) + 1
    slugCounts.set(ev.slug, count)
  }

  const seenSlugs = new Map()
  for (const ev of events) {
    if (slugCounts.get(ev.slug) > 1) {
      const currentIdx = (seenSlugs.get(ev.slug) || 0) + 1
      seenSlugs.set(ev.slug, currentIdx)
      if (currentIdx > 1) {
        // e.g. actionwochenende-2022-2
        const yearMatch = ev.slug.match(/-(\d{4})$/)
        if (yearMatch) {
          const base = ev.slug.replace(/-(\d{4})$/, '')
          ev.slug = `${base}-${currentIdx}-${yearMatch[1]}`
        } else {
          ev.slug = `${ev.slug}-${currentIdx}`
        }
      }
    }
  }

  // Sort chronologically (newest / upcoming first for readability)
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return events
}

async function main() {
  console.log(`[sync-calendar] Fetching calendar from: ${CALENDAR_URL}`)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(CALENDAR_URL, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`)
    }

    const icsText = await res.text()
    const events = parseIcs(icsText)

    if (events.length === 0) {
      console.warn('[sync-calendar] Warning: No events found in parsed feed.')
      return
    }

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(events, null, 2) + '\n', 'utf-8')
    console.log(`[sync-calendar] Successfully synced ${events.length} events to: ${OUTPUT_FILE}`)
  } catch (err) {
    console.warn(`[sync-calendar] Could not fetch live feed (${err.message}).`)
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log(`[sync-calendar] Using existing ${OUTPUT_FILE}`)
    } else {
      console.error('[sync-calendar] Error: No existing events.json found.')
      process.exit(1)
    }
  }
}

main()
