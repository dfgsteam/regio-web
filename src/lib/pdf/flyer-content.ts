import fs from 'node:fs'
import path from 'node:path'
import type { Event } from '../events/types'
import type { CampEntry } from '../camps'
import { formatDateRange, formatAgeRange } from '../events'
import flyerTemplates from '../../data/flyer-templates.json'

const BASE_DOMAIN = 'https://smj-wegweiser.de'

export interface FlyerHighlight {
  title: string
  desc: string
}

export interface ResolvedFlyerData {
  id: string
  title: string
  subtitle: string
  categoryLabel: string
  dateStr: string
  locationStr: string
  ageStr: string
  priceStr: string
  description: string
  highlights: FlyerHighlight[]
  packingList: string[]
  notes?: string
  targetUrl: string
  shortUrl: string
  contact?: {
    name?: string
    role?: string
    email?: string
    phone?: string
  }
}

interface TemplateDef {
  categoryLabel: string
  subtitle: string
  description: string
  highlights: FlyerHighlight[]
  packingList: string[]
  notes?: string
}

const defaultFallback: TemplateDef = {
  categoryLabel: 'Aktion & Abenteuer',
  subtitle: 'Raus ins Abenteuer – mit der SMJ Regio Wegweiser',
  description: 'Gemeinschaft erleben, Neues wagen und draußen sein! Bei unseren Aktionen erwarten dich spannende Spiele, handwerkliche Projekte, echte Freundschaften und erfahrene Gruppenleiter. Komm vorbei und sei dabei!',
  highlights: [
    { title: 'Echte Gemeinschaft', desc: 'Zusammenhalt und starke Erlebnisse mit Gleichaltrigen.' },
    { title: 'Spannendes Programm', desc: 'Aktionen, Spiele und Bewegung draußen an der frischen Luft.' },
    { title: 'Erfahrene Betreuung', desc: 'Verlässliche Gruppenleiter nach dem Prinzip Jugend leitet Jugend.' },
  ],
  packingList: ['Wetterfeste Kleidung', 'Feste Schuhe für draußen', 'Gute Laune und Abenteuerlust'],
}

const templates = flyerTemplates as Record<string, TemplateDef>

function loadFlyerFileOverride(slug: string): Partial<ResolvedFlyerData> | null {
  const possiblePaths = [
    path.resolve(process.cwd(), `src/content/flyers/${slug}.json`),
    path.resolve(process.cwd(), `src/content/events/${slug}.json`),
  ]

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(raw)
      } catch (err) {
        console.warn(`[flyer-content] Konnte ${filePath} nicht lesen:`, err)
      }
    }
  }

  return null
}

export function resolveFlyerData(
  slug: string,
  eventData?: Event,
  campData?: CampEntry,
): ResolvedFlyerData {
  // 1. Determine base template category
  let templateKey = 'general'
  if (campData) {
    templateKey = 'camp'
  } else if (eventData) {
    const norm = eventData.title.toLowerCase()
    if (norm.includes('sterntreffen') || norm.includes('nachtreffen')) {
      templateKey = 'sterntreffen'
    } else if (norm.includes('actionwochenende') || norm.includes('actionwoche') || eventData.category === 'weekend') {
      templateKey = 'weekend'
    } else if (norm.includes('zeltlager') || eventData.category === 'camp') {
      templateKey = 'camp'
    }
  }

  const template: TemplateDef = templates[templateKey] ?? templates.general ?? defaultFallback

  // 2. Base values from Camp, Event or Defaults
  let title = 'Aktion & Abenteuer der SMJ'
  let subtitle = template.subtitle
  let categoryLabel = template.categoryLabel
  let dateStr = 'Demnächst'
  let locationStr = 'Wiesental bei Thalwenden'
  let ageStr = 'Jungs von 9–14 Jahren'
  let priceStr = 'Auf Anfrage'
  let targetUrl = `${BASE_DOMAIN}/abenteuer/`
  let description = template.description
  let highlights = [...template.highlights]
  let packingList = [...template.packingList]
  let notes = template.notes
  let contact: ResolvedFlyerData['contact'] = undefined

  if (campData) {
    title = campData.data.title
    subtitle = campData.data.motto
      ? `Motto: ${campData.data.motto}`
      : `Das große Sommerzeltlager ${campData.data.year}`
    categoryLabel = `Zeltlager ${campData.data.year}`
    dateStr = formatDateRange(campData.data.date.start, campData.data.date.end)
    locationStr = campData.data.location.name || 'Wiesental bei Thalwenden'
    ageStr = formatAgeRange(campData.data.age.min, campData.data.age.max) || 'Jungs von 9–14 Jahren'
    priceStr = campData.data.price || '189 €'
    targetUrl = `${BASE_DOMAIN}/abenteuer/zeltlager-${campData.data.year}/`
    if (campData.data.story) {
      description = campData.data.story.replace(/\s+/g, ' ').trim()
    }
  } else if (eventData) {
    title = eventData.title
    if (eventData.teaser) {
      subtitle = eventData.teaser
    }
    dateStr = formatDateRange(eventData.start, eventData.end)
    locationStr = eventData.location || 'Klause 2.0, Heiligenstadt'
    ageStr = formatAgeRange(eventData.ageMin, eventData.ageMax) || 'Jungs von 9–14 Jahren'
    priceStr = eventData.price || 'Inkl. Verpflegung'
    targetUrl = `${BASE_DOMAIN}/abenteuer/${eventData.slug}/`

    if (eventData.description && eventData.description.length > 30) {
      description = eventData.description
    }

    if (eventData.highlights && eventData.highlights.length > 0) {
      highlights = eventData.highlights.map((h, i) => {
        const fallbackDesc = template.highlights[i]?.desc || 'Alle Details und Ablaufzeiten auf unserer Website.'
        return {
          title: h,
          desc: fallbackDesc,
        }
      })
    }

    if (eventData.packingList && eventData.packingList.length > 0) {
      packingList = [...eventData.packingList]
    }

    // Do NOT alter, reformat, or "improve" contact data here: take directly from event.contact
    if (eventData.contact) {
      contact = {
        name: eventData.contact.name,
        role: eventData.contact.role,
        email: eventData.contact.email,
        phone: eventData.contact.phone,
      }
    }
  }

  // 3. File-based override for specific Termin if a file exists in src/content/flyers/<slug>.json
  const fileOverride = loadFlyerFileOverride(slug)
  if (fileOverride) {
    if (fileOverride.title) title = fileOverride.title
    if (fileOverride.subtitle) subtitle = fileOverride.subtitle
    if (fileOverride.categoryLabel) categoryLabel = fileOverride.categoryLabel
    if (fileOverride.dateStr) dateStr = fileOverride.dateStr
    if (fileOverride.locationStr) locationStr = fileOverride.locationStr
    if (fileOverride.ageStr) ageStr = fileOverride.ageStr
    if (fileOverride.priceStr) priceStr = fileOverride.priceStr
    if (fileOverride.description) description = fileOverride.description
    if (fileOverride.highlights) highlights = fileOverride.highlights
    if (fileOverride.packingList) packingList = fileOverride.packingList
    if (fileOverride.notes) notes = fileOverride.notes
    if (fileOverride.targetUrl) targetUrl = fileOverride.targetUrl
    if (fileOverride.contact) contact = { ...contact, ...fileOverride.contact }
  }

  const shortUrl = targetUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return {
    id: slug,
    title,
    subtitle,
    categoryLabel,
    dateStr,
    locationStr,
    ageStr,
    priceStr,
    description,
    highlights,
    packingList,
    notes,
    targetUrl,
    shortUrl,
    contact,
  }
}
