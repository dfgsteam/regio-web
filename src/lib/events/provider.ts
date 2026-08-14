import { StaticJsonEventProvider } from './static'
import type { EventProvider } from './types'

// Uses the pre-synced static JSON calendar data (synced via npm run sync:calendar)
export const eventProvider: EventProvider = new StaticJsonEventProvider()
