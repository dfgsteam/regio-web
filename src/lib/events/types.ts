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
