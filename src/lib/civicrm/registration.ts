import rawRegistration from '../../data/civi-registration.json'
import type { Event } from '../events/types'

const CIVICRM_BASE_URL = 'https://civi.smj-wegweiser.de'
const LEGACY_CIVI_LINKS_ENABLED = import.meta.env.CIVICRM_LEGACY_LINKS_ENABLED !== 'false'

interface CiviRegistration {
  id: number
  title: string
  start: string
  registrationStart: string | null
  registrationEnd: string | null
  registrationEnabled: boolean
  maxParticipants: number | null
  isFull: boolean
}

export type RegistrationState = 'open' | 'upcoming' | 'closed' | 'full' | 'unavailable' | 'none'

function berlinDate(raw: string | null | undefined): Date | undefined {
  if (!raw) return undefined
  if (/Z$|[+-]\d\d:?\d\d$/.test(raw)) {
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  const parts = raw.match(/^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d)(?::(\d\d))?)?$/)
  if (!parts) return undefined
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = parts
  const approximate = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
  const offsetName = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Berlin', timeZoneName: 'shortOffset',
  }).formatToParts(new Date(approximate)).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+0'
  const offset = offsetName.match(/GMT([+-])(\d{1,2})(?::(\d\d))?/)
  const minutes = offset ? (Number(offset[2]) * 60 + Number(offset[3] ?? 0)) * (offset[1] === '+' ? 1 : -1) : 0
  return new Date(approximate - minutes * 60_000)
}

function dateInBerlin(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function normalizedTitle(title: string): string {
  return title.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

export function civiIdFromUrl(url?: string): number | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.origin !== CIVICRM_BASE_URL || !parsed.pathname.includes('/civicrm/event/register')) return undefined
    const id = Number(parsed.searchParams.get('id'))
    return Number.isSafeInteger(id) && id > 0 ? id : undefined
  } catch {
    return undefined
  }
}

function isLegacyCiviUrl(url?: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'smj-wegweiser.de' && parsed.pathname.includes('/civicrm/event/register')
  } catch {
    return false
  }
}

function registrationUrl(id: number): string {
  return `${CIVICRM_BASE_URL}/civicrm/event/register/?reset=1&id=${id}&cid=0`
}

export function getRegistrationState(event: Event, now = new Date()): RegistrationState {
  if (now >= event.start) return 'closed'
  if (event.registrationStatus === 'unavailable') return 'unavailable'
  if (event.registrationStatus === 'full') return 'full'
  if (event.registrationOpensAt && now < event.registrationOpensAt) return 'upcoming'
  if (event.registrationDeadline && now >= event.registrationDeadline) return 'closed'
  return event.registrationUrl ? 'open' : 'none'
}

export function enrichEventWithCivi(event: Event, registrations: CiviRegistration[] = rawRegistration.events): Event {
  const explicitId = event.civiEventId ? Number(event.civiEventId) : civiIdFromUrl(event.registrationUrl)
  const matched = explicitId
    ? registrations.find((entry) => entry.id === explicitId)
    : (() => {
        const candidates = registrations.filter((entry) => {
          const start = berlinDate(entry.start)
          return start && dateInBerlin(start) === dateInBerlin(event.start)
            && normalizedTitle(entry.title) === normalizedTitle(event.title)
        })
        return candidates.length === 1 ? candidates[0] : undefined
      })()

  if (!matched) {
    if (explicitId) {
      return rawRegistration.updatedAt
        ? { ...event, civiEventId: explicitId, registrationUrl: undefined, registrationStatus: 'unavailable' }
        : { ...event, civiEventId: explicitId, registrationUrl: registrationUrl(explicitId) }
    }
    if (isLegacyCiviUrl(event.registrationUrl) && !LEGACY_CIVI_LINKS_ENABLED) {
      return { ...event, registrationUrl: undefined, registrationStatus: 'unavailable' }
    }
    return event
  }

  const civiStart = berlinDate(matched.start)
  if (explicitId && (!civiStart || dateInBerlin(civiStart) !== dateInBerlin(event.start))) {
    return { ...event, civiEventId: explicitId, registrationUrl: undefined, registrationStatus: 'unavailable' }
  }

  const registrationOpensAt = berlinDate(matched.registrationStart)
  const registrationDeadline = berlinDate(matched.registrationEnd)
  return {
    ...event,
    civiEventId: matched.id,
    registrationUrl: matched.registrationEnabled ? registrationUrl(matched.id) : undefined,
    registrationOpensAt,
    registrationDeadline,
    registrationStatus: !matched.registrationEnabled ? 'unavailable' : matched.isFull ? 'full' : undefined,
  }
}
