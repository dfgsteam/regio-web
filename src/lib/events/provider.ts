import { ICalEventProvider } from './ical'
import type { EventProvider } from './types'

// Fetches live from Google Calendar iCal feed with fallback to MockEventProvider
export const eventProvider: EventProvider = new ICalEventProvider()
