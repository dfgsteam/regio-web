import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'
import { eventProvider } from './events/provider'
import { getRegistrationState } from './civicrm/registration'
import type { RegistrationState } from './civicrm/registration'

export type CampEntry = CollectionEntry<'camps'>

export async function getCampRegistration(camp: CampEntry['data']): Promise<{
  state: RegistrationState
  url?: string
  opensAt?: Date
  deadline?: Date
  closesAt: Date
}> {
  const events = await eventProvider.getEvents()
  const linked = events.find((event) => event.category === 'camp' && event.start.getFullYear() === camp.year)
  if (!camp.active || !camp.registration.enabled) {
    return { state: 'unavailable', closesAt: camp.date.start }
  }
  if (linked?.civiEventId) {
    return {
      state: getRegistrationState(linked),
      url: linked.registrationUrl,
      opensAt: linked.registrationOpensAt,
      deadline: linked.registrationDeadline,
      closesAt: linked.registrationDeadline && linked.registrationDeadline < linked.start
        ? linked.registrationDeadline : linked.start,
    }
  }

  return {
    state: isCampRegistrationOpen(camp) ? 'open' : 'closed',
    url: camp.registration.url,
    deadline: camp.registration.deadline,
    closesAt: camp.registration.deadline && camp.registration.deadline.getTime() + 86_400_000 < camp.date.start.getTime()
      ? new Date(camp.registration.deadline.getTime() + 86_400_000) : camp.date.start,
  }
}

export function isCampRegistrationOpen(camp: CampEntry['data'], now = new Date()): boolean {
  if (!camp.active || !camp.registration.enabled || !camp.registration.url) return false

  // Dates in camp frontmatter have no time component. The deadline remains
  // valid through its listed day; registration closes when the camp starts.
  const deadlineEnd = camp.registration.deadline
    ? camp.registration.deadline.getTime() + 86_400_000
    : Number.POSITIVE_INFINITY

  return now.getTime() < Math.min(deadlineEnd, camp.date.start.getTime())
}

export async function getCampByYear(year?: string | number): Promise<CampEntry | null> {
  const camps = await getCollection('camps')
  const target = Number(year)
  if (!Number.isFinite(target)) return null
  return camps.find((camp) => camp.data.year === target) ?? null
}

export async function getCurrentCamp(): Promise<CampEntry | null> {
  const camps = await getCollection('camps')
  const active = camps.filter((camp) => camp.data.active)
  return active.sort((a, b) => b.data.year - a.data.year)[0] ?? null
}

export async function getAllCamps(): Promise<CampEntry[]> {
  const camps = await getCollection('camps')
  return camps.sort((a, b) => b.data.year - a.data.year)
}

// Resolves the camp an MDX camp component is rendered for.
// Camp MDX components live inside [year] pages, so the year comes
// from the URL. Falls back to the current camp for safety.
export async function resolveCampForUrl(url: string): Promise<CampEntry | null> {
  const segment = url.split('/').filter(Boolean).pop()
  if (segment && /^\d{4}$/.test(segment)) {
    const byYear = await getCampByYear(segment)
    if (byYear) return byYear
  }
  return getCurrentCamp()
}

export function campDays(camp: CampEntry): number {
  const start = camp.data.date.start.getTime()
  const end = camp.data.date.end.getTime()
  return Math.round((end - start) / 86_400_000) + 1
}
