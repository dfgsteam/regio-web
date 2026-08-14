import { MockEventProvider } from './mock'
import type { EventProvider } from './types'

// The UI never knows where event data comes from.
// Swap this for a CiviCrmEventProvider later without touching components.
export const eventProvider: EventProvider = new MockEventProvider()
