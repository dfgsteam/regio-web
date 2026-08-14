import type { CiviCrmApiResponse, CiviCrmEventPayload } from './types'

// Server-only module. Never import this into browser code.
// Credentials are read from environment variables at request/build time.

const baseUrl = import.meta.env.CIVICRM_BASE_URL as string | undefined
const apiKey = import.meta.env.CIVICRM_API_KEY as string | undefined
const siteKey = import.meta.env.CIVICRM_SITE_KEY as string | undefined

export function isCiviCrmConfigured(): boolean {
  return Boolean(baseUrl && apiKey && siteKey)
}

export class CiviCrmClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'CiviCrmClientError'
  }
}

export class CiviCrmClient {
  constructor(
    private readonly url: string = baseUrl ?? '',
    private readonly key: string = apiKey ?? '',
    private readonly site: string = siteKey ?? '',
  ) {}

  async getEvents(): Promise<CiviCrmEventPayload[]> {
    if (!this.url || !this.key || !this.site) {
      throw new CiviCrmClientError('CiviCRM is not configured')
    }

    const params = new URLSearchParams({
      entity: 'Event',
      action: 'get',
      json: '1',
      sequential: '1',
      api_key: this.key,
      key: this.site,
    })

    const response = await fetch(`${this.url}/civicrm/ajax/rest?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new CiviCrmClientError(`CiviCRM request failed with status ${response.status}`, response.status)
    }

    const body = (await response.json()) as CiviCrmApiResponse<CiviCrmEventPayload>
    if (body.is_error !== 0) {
      throw new CiviCrmClientError('CiviCRM returned an error payload')
    }
    return body.values
  }
}
