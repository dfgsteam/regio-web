export type EventCategory = 'weekend' | 'camp' | 'special'

export interface EventContact {
  name: string
  email?: string
  phone?: string
}

export interface Event {
  id: string
  title: string
  slug: string
  start: Date
  end: Date
  location?: string
  ageMin?: number
  ageMax?: number
  teaser?: string
  description?: string
  registrationUrl?: string
  registrationDeadline?: Date
  category: EventCategory
  contact?: EventContact
}

export interface EventProvider {
  getEvents(): Promise<Event[]>
  getEvent(id: string): Promise<Event | null>
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
