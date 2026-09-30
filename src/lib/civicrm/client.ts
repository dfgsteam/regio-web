import type { CiviGroup, CiviRecipient, CampaignDraftResult } from './types'
import { MOCK_CIVI_GROUPS, MOCK_CIVI_RECIPIENTS } from './mock'

const CIVICRM_BASE_URL = process.env.CIVICRM_BASE_URL || 'https://civi.smj-wegweiser.de'
const CIVICRM_API_KEY = process.env.CIVICRM_API_KEY
const CIVICRM_SITE_KEY = process.env.CIVICRM_SITE_KEY

/**
 * Low-level CiviCRM APIv4 call wrapper
 */
export async function api4<T = unknown>(
  entity: string,
  action: string,
  params: Record<string, unknown>,
  timeoutMs = 12000,
): Promise<T[]> {
  if (!CIVICRM_API_KEY) {
    throw new Error('CIVICRM_API_KEY is not set')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const url = `${CIVICRM_BASE_URL}/civicrm/ajax/api4/${entity}/${action}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Civi-Auth': `Bearer ${CIVICRM_API_KEY}`,
        ...(CIVICRM_SITE_KEY ? { 'X-Civi-Key': CIVICRM_SITE_KEY } : {}),
      },
      body: new URLSearchParams({ params: JSON.stringify(params) }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`CiviCRM APIv4 ${entity}.${action} HTTP ${response.status}`)
    }

    const data = await response.json()
    if (data.error_message) {
      throw new Error(`CiviCRM APIv4 ${entity}.${action}: ${data.error_message}`)
    }

    if (!Array.isArray(data.values)) {
      throw new Error(`CiviCRM APIv4 ${entity}.${action} returned unexpected payload`)
    }

    return data.values as T[]
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Retrieves all relevant groups and smartgroups from CiviCRM.
 * Falls back to mock data if CiviCRM is unavailable.
 */
export async function getCampaignGroups(): Promise<CiviGroup[]> {
  if (!CIVICRM_API_KEY) {
    return MOCK_CIVI_GROUPS
  }

  try {
    const rawGroups = await api4<{
      id: number
      name: string
      title: string
      description?: string
      saved_search_id?: number | null
      group_type?: string[]
      is_active: boolean
    }>('Group', 'get', {
      select: ['id', 'name', 'title', 'description', 'saved_search_id', 'group_type', 'is_active'],
      where: [['is_active', '=', true], ['is_hidden', '=', false]],
      orderBy: { title: 'ASC' },
      limit: 50,
    })

    if (!rawGroups || rawGroups.length === 0) {
      return MOCK_CIVI_GROUPS
    }

    return rawGroups.map((g) => ({
      id: g.id,
      name: g.name,
      title: g.title,
      description: g.description || undefined,
      isSmart: Boolean(g.saved_search_id && g.saved_search_id > 0),
    }))
  } catch (error) {
    console.warn('[civicrm] Failed to fetch groups from CiviCRM, using mock groups:', error)
    return MOCK_CIVI_GROUPS
  }
}

/**
 * Retrieves contacts belonging to a specific group/smartgroup from CiviCRM.
 * Normalizes contact data into CiviRecipient records with addresses and salutations.
 */
export async function getGroupRecipients(groupId: number): Promise<CiviRecipient[]> {
  if (!CIVICRM_API_KEY) {
    return MOCK_CIVI_RECIPIENTS[groupId] || MOCK_CIVI_RECIPIENTS[12] || []
  }

  try {
    // 1. Try querying contacts in group via APIv4
    // Using GroupContact for regular groups or Contact.get with saved search
    interface RawContact {
      id: number
      display_name: string
      first_name?: string
      last_name?: string
      birth_date?: string
      email_primary?: { email: string }
      phone_primary?: { phone: string }
      address_primary?: {
        street_address?: string
        postal_code?: string
        city?: string
      }
    }

    const contacts = await api4<RawContact>('Contact', 'get', {
      select: [
        'id',
        'display_name',
        'first_name',
        'last_name',
        'birth_date',
        'email_primary.email',
        'phone_primary.phone',
        'address_primary.street_address',
        'address_primary.postal_code',
        'address_primary.city',
      ],
      where: [['groups', 'CONTAINS', groupId]],
      limit: 100,
    })

    if (!contacts || contacts.length === 0) {
      return MOCK_CIVI_RECIPIENTS[groupId] || MOCK_CIVI_RECIPIENTS[12] || []
    }

    return contacts.map((c) => {
      const firstName = (c.first_name || '').trim() || (c.display_name.split(' ')[0] ?? '')
      const lastName = (c.last_name || '').trim() || (c.display_name.split(' ').slice(1).join(' ') ?? '')
      const street = c.address_primary?.street_address?.trim() || ''
      const postalCode = c.address_primary?.postal_code?.trim() || ''
      const city = c.address_primary?.city?.trim() || ''
      const email = c.email_primary?.email?.trim() || undefined
      const phone = c.phone_primary?.phone?.trim() || undefined

      const hasValidAddress = Boolean(street && postalCode && city)

      let age: number | undefined
      if (c.birth_date) {
        const bd = new Date(c.birth_date)
        if (!Number.isNaN(bd.getTime())) {
          const now = new Date()
          age = now.getFullYear() - bd.getFullYear()
          const m = now.getMonth() - bd.getMonth()
          if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) {
            age--
          }
        }
      }

      return {
        id: c.id,
        firstName,
        lastName,
        displayName: c.display_name,
        salutation: firstName ? `Lieber ${firstName}` : `Lieber Teilnehmer`,
        formalSalutation: lastName ? `Liebe Familie ${lastName}` : `Liebe Eltern`,
        age,
        birthDate: c.birth_date,
        address: hasValidAddress
          ? {
              street,
              postalCode,
              city,
            }
          : undefined,
        email,
        phone,
        mobile: phone && phone.startsWith('01') ? phone : undefined,
        hasValidAddress,
        hasValidEmail: Boolean(email),
        hasValidPhone: Boolean(phone),
      }
    })
  } catch (error) {
    console.warn(`[civicrm] Failed to fetch contacts for group ${groupId}, using mock data:`, error)
    return MOCK_CIVI_RECIPIENTS[groupId] || MOCK_CIVI_RECIPIENTS[12] || []
  }
}

/**
 * Creates a Mailing draft in CiviCRM for the targeted group.
 */
export async function createCiviMailingDraft(options: {
  subject: string
  bodyHtml: string
  groupId: number
  campaignName: string
}): Promise<CampaignDraftResult> {
  if (!CIVICRM_API_KEY) {
    return {
      success: true,
      type: 'email',
      civicrmId: Math.floor(Math.random() * 900) + 100,
      message: 'Simulierter CiviCRM-Entwurf angelegt (Offline/Mock-Modus)',
      details: { subject: options.subject, groupId: options.groupId },
    }
  }

  try {
    const res = await api4<{ id: number }>('Mailing', 'create', {
      values: {
        name: `${options.campaignName} (Entwurf)`,
        subject: options.subject,
        body_html: options.bodyHtml,
        groups: { include: [options.groupId] },
      },
    })

    const created = res[0]
    return {
      success: true,
      type: 'email',
      civicrmId: created?.id,
      message: `Mailing-Entwurf erfolgreich in CiviCRM angelegt (ID: ${created?.id})`,
      details: { mailingId: created?.id },
    }
  } catch (error: any) {
    console.error('[civicrm] Failed to create Mailing draft:', error)
    // Fallback: try creating as MessageTemplate or Activity
    try {
      const act = await api4<{ id: number }>('Activity', 'create', {
        values: {
          activity_type_id: 3, // Email
          subject: `[Entwurf] ${options.subject}`,
          details: options.bodyHtml,
          status_id: 1, // Scheduled / Draft
        },
      })
      return {
        success: true,
        type: 'email',
        civicrmId: act[0]?.id,
        message: `Als E-Mail-Aktivitätsentwurf in CiviCRM angelegt (ID: ${act[0]?.id})`,
      }
    } catch (e2: any) {
      return {
        success: false,
        type: 'email',
        message: `Fehler beim Erstellen des CiviCRM-Entwurfs: ${error?.message || error}`,
      }
    }
  }
}

/**
 * Creates an SMS draft/activity in CiviCRM.
 */
export async function createCiviSmsDraft(options: {
  text: string
  groupId: number
  campaignName: string
}): Promise<CampaignDraftResult> {
  if (!CIVICRM_API_KEY) {
    return {
      success: true,
      type: 'sms',
      civicrmId: Math.floor(Math.random() * 900) + 500,
      message: 'Simulierter SMS-Entwurf angelegt (Offline/Mock-Modus)',
      details: { text: options.text, groupId: options.groupId },
    }
  }

  try {
    const act = await api4<{ id: number }>('Activity', 'create', {
      values: {
        activity_type_id: 4, // SMS activity in CiviCRM
        subject: `SMS: ${options.campaignName}`,
        details: options.text,
        status_id: 1, // Scheduled / Draft
      },
    })

    return {
      success: true,
      type: 'sms',
      civicrmId: act[0]?.id,
      message: `SMS-Entwurf erfolgreich als CiviCRM-Aktivität angelegt (ID: ${act[0]?.id})`,
      details: { activityId: act[0]?.id },
    }
  } catch (error: any) {
    console.error('[civicrm] Failed to create SMS draft:', error)
    return {
      success: false,
      type: 'sms',
      message: `Fehler beim Erstellen der SMS in CiviCRM: ${error?.message || error}`,
    }
  }
}
