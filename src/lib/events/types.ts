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
  if (normalized.startsWith('sterntreffen') || normalized.includes('sterntreffen')) {
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
 * 1. Zeltlager: Regardless of what comes after the word Zeltlager -> zeltlager-{year}
 * 2. Sterntreffen: Regardless of what comes after -> sterntreffen-{year}
 * 3. All other calendar events: Take full calendar name (with Roman numerals/numbers or no numbers) + -{year}
 */
export function normalizeEventSlug(title: string, year: number): string {
  const normalizedTitle = title.trim().toLowerCase()

  // Zeltlager rule: regardless of extra text in the title -> zeltlager-{year}
  if (normalizedTitle.includes('zeltlager')) {
    return `zeltlager-${year}`
  }

  // Sterntreffen rule: regardless of extra text in the title -> sterntreffen-{year}
  if (normalizedTitle.includes('sterntreffen')) {
    return `sterntreffen-${year}`
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

export function getSlugVariants(slug: string): string[] {
  const variants = new Set<string>([slug])

  // Bidirectional mapping between Arabic numbers and Roman numerals
  // e.g. actionwochenende-2-2026 <-> actionwochenende-ii-2026
  if (slug.includes('-1-')) variants.add(slug.replace('-1-', '-i-'))
  if (slug.includes('-2-')) variants.add(slug.replace('-2-', '-ii-'))
  if (slug.includes('-3-')) variants.add(slug.replace('-3-', '-iii-'))
  if (slug.includes('-4-')) variants.add(slug.replace('-4-', '-iv-'))
  if (slug.includes('-5-')) variants.add(slug.replace('-5-', '-v-'))

  if (slug.includes('-i-')) variants.add(slug.replace('-i-', '-1-'))
  if (slug.includes('-ii-')) variants.add(slug.replace('-ii-', '-2-'))
  if (slug.includes('-iii-')) variants.add(slug.replace('-iii-', '-3-'))
  if (slug.includes('-iv-')) variants.add(slug.replace('-iv-', '-4-'))
  if (slug.includes('-v-')) variants.add(slug.replace('-v-', '-5-'))

  return Array.from(variants)
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
