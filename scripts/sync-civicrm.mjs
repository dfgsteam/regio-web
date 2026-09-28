#!/usr/bin/env node

// Sync public registration metadata only. Participant records are counted in
// memory and are never written to the repository or the generated website.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const CIVICRM_BASE_URL = 'https://civi.smj-wegweiser.de'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'src/data/civi-registration.json')

for (const name of ['.env', '.env.local']) {
  const file = path.join(root, name)
  if (fs.existsSync(file)) process.loadEnvFile(file)
}

const apiKey = process.env.CIVICRM_API_KEY
const siteKey = process.env.CIVICRM_SITE_KEY

export async function api4(entity, action, params, fetcher = fetch) {
  if (!apiKey) throw new Error('CIVICRM_API_KEY fehlt')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetcher(`${CIVICRM_BASE_URL}/civicrm/ajax/api4/${entity}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Civi-Auth': `Bearer ${apiKey}`,
        ...(siteKey ? { 'X-Civi-Key': siteKey } : {}),
      },
      body: new URLSearchParams({ params: JSON.stringify(params) }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`${entity}.${action}: HTTP ${response.status}`)
    const result = await response.json()
    if (result.error_message) throw new Error(`${entity}.${action}: ${result.error_message}`)
    if (!Array.isArray(result.values)) throw new Error(`${entity}.${action}: ungültige APIv4-Antwort`)
    return result.values
  } finally {
    clearTimeout(timeout)
  }
}

function countParticipants(participants, countedStatuses, countedRoles) {
  const counts = new Map()
  for (const participant of participants) {
    if (!countedStatuses.has(Number(participant.status_id))) continue
    const roles = Array.isArray(participant.role_id) ? participant.role_id : [participant.role_id]
    if (!roles.some((role) => countedRoles.has(Number(role)))) continue
    const id = Number(participant.event_id)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

export async function loadRegistrationEvents(query = api4) {
  const earliestStart = new Date(Date.now() - 86_400_000).toISOString().slice(0, 19).replace('T', ' ')
  const events = await query('Event', 'get', {
    select: ['id', 'title', 'start_date', 'is_active', 'is_public', 'is_online_registration',
      'registration_start_date', 'registration_end_date', 'max_participants'],
    where: [['is_active', '=', true], ['start_date', '>=', earliestStart]],
  })

  const relevant = events.filter((event) => event.is_public && event.is_online_registration)
  const limited = relevant.filter((event) => Number(event.max_participants) > 0)
  let counts = new Map()

  if (limited.length) {
    const [statuses, roles, participants] = await Promise.all([
      query('ParticipantStatusType', 'get', {
        select: ['id', 'is_counted'], where: [['is_counted', '=', true]],
      }),
      query('OptionValue', 'get', {
        select: ['value', 'filter'], where: [['option_group_id:name', '=', 'participant_role']],
      }),
      query('Participant', 'get', {
        select: ['event_id', 'status_id', 'role_id'],
        where: [['event_id', 'IN', limited.map((event) => Number(event.id))]],
      }),
    ])
    const countedStatuses = new Set(statuses.map((status) => Number(status.id)))
    const countedRoles = new Set(roles.filter((role) => Number(role.filter) === 1).map((role) => Number(role.value)))
    if (!countedStatuses.size || !countedRoles.size) throw new Error('Zählstatus oder Teilnehmerrollen fehlen')
    counts = countParticipants(participants, countedStatuses, countedRoles)
  }

  return events.map((event) => ({
    id: Number(event.id),
    title: event.title,
    start: event.start_date,
    registrationStart: event.registration_start_date || null,
    registrationEnd: event.registration_end_date || null,
    registrationEnabled: Boolean(event.is_public && event.is_online_registration),
    maxParticipants: Number(event.max_participants) || null,
    isFull: Number(event.max_participants) > 0
      ? (counts.get(Number(event.id)) ?? 0) >= Number(event.max_participants)
      : false,
  }))
}

async function main() {
  if (!apiKey) {
    console.log('[sync-civicrm] Kein API-Key; vorhandener Cache bleibt erhalten.')
    return
  }
  try {
    const events = await loadRegistrationEvents()
    const data = JSON.stringify({ updatedAt: new Date().toISOString(), events }, null, 2) + '\n'
    const temporary = `${output}.tmp`
    fs.writeFileSync(temporary, data)
    fs.renameSync(temporary, output)
    console.log(`[sync-civicrm] ${events.length} Anmeldungen synchronisiert.`)
  } catch (error) {
    console.warn(`[sync-civicrm] ${error.message}; vorhandener Cache bleibt erhalten.`)
    if (!fs.existsSync(output)) process.exitCode = 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
