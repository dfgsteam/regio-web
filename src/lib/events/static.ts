import type { Event, EventProvider } from './types'
import rawEvents from '../../data/events.json'
import { enrichEventWithCivi } from '../civicrm/registration'

function parseJsonEvent(item: any): Event {
  return {
    ...item,
    start: new Date(item.start),
    end: new Date(item.end),
    registrationOpensAt: item.registrationOpensAt ? new Date(item.registrationOpensAt) : undefined,
    registrationDeadline: item.registrationDeadline ? new Date(item.registrationDeadline) : undefined,
  }
}

const staticEvents: Event[] = (rawEvents as any[])
  .filter((item) => !item.disabled && !item.hidden)
  .map(parseJsonEvent)
  .map((event) => enrichEventWithCivi(event))

export class StaticJsonEventProvider implements EventProvider {
  async getEvents(): Promise<Event[]> {
    return staticEvents
  }

  async getEvent(id: string): Promise<Event | null> {
    return staticEvents.find((event) => event.id === id || event.slug === id) ?? null
  }
}
