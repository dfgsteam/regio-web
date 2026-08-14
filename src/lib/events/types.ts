export type EventCategory = 'weekend' | 'camp' | 'special' | 'general'

export type EventTemplateType = 'actionwochenende' | 'sterntreffen' | 'blanko'

export interface EventContact {
  name: string
  email?: string
  phone?: string
  role?: string
}

export interface Event {
  id: string
  title: string
  slug: string
  start: Date
  end: Date
  location?: string
  address?: string
  ageMin?: number
  ageMax?: number
  price?: string
  teaser?: string
  description?: string
  highlights?: string[]
  packingList?: string[]
  image?: string
  registrationUrl?: string
  registrationDeadline?: Date
  category: EventCategory
  contact?: EventContact
}

export interface EventProvider {
  getEvents(): Promise<Event[]>
  getEvent(id: string): Promise<Event | null>
}

export function getEventTemplateType(title: string, category?: string): EventTemplateType {
  const normalized = title.trim().toLowerCase()
  if (
    normalized.startsWith('sterntreffen') ||
    normalized.includes('sterntreffen') ||
    normalized.includes('nachtreffen')
  ) {
    return 'sterntreffen'
  }
  if (
    normalized.startsWith('actionwochenende') ||
    normalized.includes('actionwochenende') ||
    normalized.includes('actionwoche') ||
    category === 'weekend'
  ) {
    return 'actionwochenende'
  }
  return 'blanko'
}

/**
 * Normalizes an event title into a clean URL slug according to the workflow rules:
 * 1. Sterntreffen / Zeltlagernachtreffen: Regardless of wording -> sterntreffen-{year}
 * 2. Zeltlager: Regardless of what comes after the word Zeltlager (except Nachtreffen) -> zeltlager-{year}
 * 3. All other calendar events: Take full calendar name (with Roman numerals/numbers or no numbers) + -{year}
 */
export function normalizeEventSlug(title: string, year: number): string {
  const normalizedTitle = title.trim().toLowerCase()

  // Sterntreffen / Zeltlagernachtreffen rule: always maps to sterntreffen-{year}
  if (normalizedTitle.includes('sterntreffen') || normalizedTitle.includes('nachtreffen')) {
    return `sterntreffen-${year}`
  }

  // Zeltlager rule (pure camp only): regardless of extra text in the title -> zeltlager-{year}
  if (normalizedTitle.includes('zeltlager')) {
    return `zeltlager-${year}`
  }

  // All other calendar events: take calendar name, normalize characters/Roman numerals, append -{year}
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

/**
 * Generates all natural alias slugs for an event:
 * - With and without year (e.g. familientag-2026, familientag)
 * - Short prefix before separators (e.g. "Familientag im Rahmen..." -> "familientag-2026", "familientag")
 * - Arabic numbers and Roman numerals (e.g. actionwochenende-2-2026, actionwochenende-ii-2026, actionwochenende-2)
 */
export function getSlugVariants(eventOrSlug: string, title?: string, year?: number): string[] {
  const variants = new Set<string>()

  const baseSlug = typeof eventOrSlug === 'string' ? eventOrSlug : ''
  if (baseSlug) variants.add(baseSlug)

  // 1. If we have a year or slug ends with -YYYY
  const yearMatch = baseSlug.match(/-(\d{4})$/)
  const eventYear = year ?? (yearMatch?.[1] ? parseInt(yearMatch[1], 10) : undefined)
  const slugWithoutYear = yearMatch ? baseSlug.replace(/-(\d{4})$/, '') : baseSlug

  if (slugWithoutYear) {
    variants.add(slugWithoutYear)
    if (eventYear) {
      variants.add(`${slugWithoutYear}-${eventYear}`)
    }
  }

  // 2. Short title / prefix extraction
  // If title was "Familientag im Rahmen der BDKJ Sozialaktion", short prefix is "Familientag"
  const rawTitle = title || baseSlug
  const cleanTitle = rawTitle
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')

  const prefixMatch = cleanTitle.match(/^([a-z0-9]+(?:\s+[a-z0-9]+)?)(?:\s+(?:im|in|fuer|für|der|des|-|–|\(|\/)|$)/i)
  if (prefixMatch && prefixMatch[1]) {
    const shortSlug = prefixMatch[1].replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (shortSlug && shortSlug.length >= 3) {
      variants.add(shortSlug)
      if (eventYear) {
        variants.add(`${shortSlug}-${eventYear}`)
      }
    }
  }

  // 3. Bidirectional mapping between Arabic numbers and Roman numerals
  const allCurrent = Array.from(variants)
  for (const s of allCurrent) {
    if (s.includes('-1-')) variants.add(s.replace('-1-', '-i-'))
    if (s.includes('-2-')) variants.add(s.replace('-2-', '-ii-'))
    if (s.includes('-3-')) variants.add(s.replace('-3-', '-iii-'))
    if (s.includes('-4-')) variants.add(s.replace('-4-', '-iv-'))
    if (s.includes('-5-')) variants.add(s.replace('-5-', '-v-'))

    if (s.endsWith('-1')) variants.add(s.replace(/-1$/, '-i'))
    if (s.endsWith('-2')) variants.add(s.replace(/-2$/, '-ii'))
    if (s.endsWith('-3')) variants.add(s.replace(/-3$/, '-iii'))
    if (s.endsWith('-4')) variants.add(s.replace(/-4$/, '-iv'))
    if (s.endsWith('-5')) variants.add(s.replace(/-5$/, '-v'))

    if (s.includes('-i-')) variants.add(s.replace('-i-', '-1-'))
    if (s.includes('-ii-')) variants.add(s.replace('-ii-', '-2-'))
    if (s.includes('-iii-')) variants.add(s.replace('-iii-', '-3-'))
    if (s.includes('-iv-')) variants.add(s.replace('-iv-', '-4-'))
    if (s.includes('-v-')) variants.add(s.replace('-v-', '-5-'))

    if (s.endsWith('-i')) variants.add(s.replace(/-i$/, '-1'))
    if (s.endsWith('-ii')) variants.add(s.replace(/-ii$/, '-2'))
    if (s.endsWith('-iii')) variants.add(s.replace(/-iii$/, '-3'))
    if (s.endsWith('-iv')) variants.add(s.replace(/-iv$/, '-4'))
    if (s.endsWith('-v')) variants.add(s.replace(/-v$/, '-5'))
  }

  return Array.from(variants).filter((v) => v.length > 0)
}

export function formatDateRange(start: Date, end: Date, locale = 'de-DE'): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    return `${start.toLocaleDateString(locale, { day: '2-digit' })}.–${end.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}`.toUpperCase()
  }
  return `${start.toLocaleDateString(locale, { day: '2-digit', month: 'long' })} – ${end.toLocaleDateString(
    locale,
    { day: '2-digit', month: 'long', year: 'numeric' },
  )}`.toUpperCase()
}

export function formatAgeRange(min?: number, max?: number): string | null {
  if (min == null && max == null) return null
  if (min == null) return `${max}+ JAHRE`
  if (max == null) return `${min}+ JAHRE`
  return `${min}–${max} JAHRE`
}
