import type { Event, EventProvider } from '../events/types'
import { CiviCrmClient, CiviCrmClientError, isCiviCrmConfigured } from './client'
import { mapCiviCrmEvent } from './mapper'

// Fallback mock events used as a last-resort cache when CiviCRM is
// unavailable, so the site never renders an empty/broken event state.
import { eventProvider as mockEvents } from '../events/provider'

let lastSuccessfulEvents: Event[] | null = null

export class CiviCrmEventProvider implements EventProvider {
  private readonly client = new CiviCrmClient()

  async getEvents(): Promise<Event[]> {
    if (!isCiviCrmConfigured()) {
      return this.fallback()
    }
    try {
      const payloads = await this.client.getEvents()
      const events = payloads.map(mapCiviCrmEvent)
      lastSuccessfulEvents = events
      return events
    } catch (error) {
      if (error instanceof CiviCrmClientError) {
        console.warn('[civicrm] fetch failed, serving cached events:', error.message)
      }
      return this.fallback()
    }
  }

  async getEvent(id: string): Promise<Event | null> {
    const events = await this.getEvents()
    return events.find((event) => event.id === id) ?? null
  }

  private async fallback(): Promise<Event[]> {
    if (lastSuccessfulEvents) return lastSuccessfulEvents
    const mocks = await mockEvents.getEvents()
    return mocks
  }
}
