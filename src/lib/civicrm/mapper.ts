import type { Event, EventCategory } from '../events/types'
import type { CiviCrmEventPayload } from './types'

// Maps raw CiviCRM payloads onto the internal Event domain model.
// UI components must never see raw CiviCRM shapes.

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function categoryFromEventType(eventTypeId: string): EventCategory {
  switch (eventTypeId) {
    case 'zeltlager':
      return 'camp'
    case 'sonderevent':
      return 'special'
    default:
      return 'weekend'
  }
}

export function mapCiviCrmEvent(payload: CiviCrmEventPayload): Event {
  return {
    id: payload.id,
    title: payload.title,
    slug: slugify(payload.title),
    start: new Date(payload.start_date),
    end: new Date(payload.end_date),
    location: payload.location,
    teaser: payload.custom?.teaser,
    description: payload.custom?.description,
    registrationUrl: payload.registration_link,
    registrationDeadline: payload.registration_end_date
      ? new Date(payload.registration_end_date)
      : undefined,
    category: categoryFromEventType(payload.event_type_id),
    contact: payload.contact
      ? {
          name: payload.contact.display_name,
          email: payload.contact.email,
          phone: payload.contact.phone,
        }
      : undefined,
  }
}
