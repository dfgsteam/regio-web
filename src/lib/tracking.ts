/**
 * Utility to append Matomo campaign tracking parameters to URLs.
 * Parameters:
 * - mtm_campaign: Campaign identifier (e.g. zeltlager-2027, actionwochenende-2026)
 * - mtm_source: Traffic source (e.g. email, whatsapp, flyer, plakat, instagram)
 * - mtm_medium: Medium type (e.g. newsletter, messenger, qr-code, social, print)
 */
export function addTrackingParams(
  url: string,
  campaign: string,
  source: string,
  medium: string,
): string {
  if (!url) return url
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('mtm_campaign', campaign)
    parsed.searchParams.set('mtm_source', source)
    parsed.searchParams.set('mtm_medium', medium)
    return parsed.toString()
  } catch {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}mtm_campaign=${encodeURIComponent(campaign)}&mtm_source=${encodeURIComponent(source)}&mtm_medium=${encodeURIComponent(medium)}`
  }
}
