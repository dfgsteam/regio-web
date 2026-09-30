export interface CiviGroup {
  id: number
  name: string
  title: string
  description?: string
  isSmart: boolean
  contactCount?: number
}

export interface CiviRecipientAddress {
  street: string
  postalCode: string
  city: string
  country?: string
}

export interface CiviRecipient {
  id: number
  firstName: string
  lastName: string
  displayName: string
  salutation: string // e.g. "Lieber Lukas"
  formalSalutation: string // e.g. "Liebe Familie Müller"
  age?: number
  birthDate?: string
  address?: CiviRecipientAddress
  email?: string
  phone?: string
  mobile?: string
  hasValidAddress: boolean
  hasValidEmail: boolean
  hasValidPhone: boolean
  parentNames?: string
}

export interface CampaignEventData {
  id: string
  title: string
  subtitle?: string
  category: string
  dateStr: string
  locationStr: string
  ageStr: string
  priceStr: string
  registrationUrl: string
  highlights?: string[]
}

export interface CampaignDraftResult {
  success: boolean
  type: 'email' | 'sms'
  civicrmId?: number
  civiUrl?: string
  message: string
  details?: Record<string, unknown>
}
