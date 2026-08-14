import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

export type CampEntry = CollectionEntry<'camps'>

export async function getCampByYear(year?: string | number): Promise<CampEntry | null> {
  const camps = await getCollection('camps')
  const target = Number(year)
  if (!Number.isFinite(target)) return null
  return camps.find((camp) => camp.data.year === target) ?? null
}

export async function getCurrentCamp(): Promise<CampEntry | null> {
  const camps = await getCollection('camps')
  const active = camps.filter((camp) => camp.data.active)
  return active.sort((a, b) => b.data.year - a.data.year)[0] ?? null
}

export async function getAllCamps(): Promise<CampEntry[]> {
  const camps = await getCollection('camps')
  return camps.sort((a, b) => b.data.year - a.data.year)
}

// Resolves the camp an MDX camp component is rendered for.
// Camp MDX components live inside [year] pages, so the year comes
// from the URL. Falls back to the current camp for safety.
export async function resolveCampForUrl(url: string): Promise<CampEntry | null> {
  const segment = url.split('/').filter(Boolean).pop()
  if (segment && /^\d{4}$/.test(segment)) {
    const byYear = await getCampByYear(segment)
    if (byYear) return byYear
  }
  return getCurrentCamp()
}

export function campDays(camp: CampEntry): number {
  const start = camp.data.date.start.getTime()
  const end = camp.data.date.end.getTime()
  return Math.round((end - start) / 86_400_000) + 1
}
