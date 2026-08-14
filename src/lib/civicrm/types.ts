// Raw CiviCRM payload shapes. Never leak these into UI components.
// The mapper converts them into the internal Event domain model.

export interface CiviCrmContact {
  id: string
  display_name: string
  email?: string
  phone?: string
}

export interface CiviCrmEventPayload {
  id: string
  title: string
  event_type_id: string
  start_date: string
  end_date: string
  location?: string
  is_public: boolean
  is_active: boolean
  registration_link?: string
  registration_start_date?: string
  registration_end_date?: string
  contact?: CiviCrmContact
  custom?: Record<string, string>
}

export interface CiviCrmApiResponse<T> {
  is_error: number
  count: number
  values: T[]
}
