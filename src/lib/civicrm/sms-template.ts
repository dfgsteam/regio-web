import type { CampaignEventData } from './types'

export interface SmsDraftDetails {
  text: string
  characterCount: number
  segmentCount: number
}

export function generateCampaignSmsText(event: CampaignEventData): SmsDraftDetails {
  const shortUrl = event.registrationUrl.replace(/^https?:\/\//, '')
  const text = `Hallo {contact.first_name|Abenteurer}! Lust auf echtes Abenteuer? Die SMJ laedt dich ein: ${event.title} (${event.dateStr}, ${event.locationStr}). Jetzt Platz sichern: ${shortUrl} - Dein SMJ Team`

  // SMS GSM 7-bit standard is 160 chars for 1 segment, 153 chars per segment if multi-part.
  const characterCount = text.length
  const segmentCount = characterCount <= 160 ? 1 : Math.ceil(characterCount / 153)

  return {
    text,
    characterCount,
    segmentCount,
  }
}
