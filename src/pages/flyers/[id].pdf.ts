import type { APIRoute } from 'astro'
import { eventProvider, formatDateRange, formatAgeRange, getSlugVariants } from '../../lib/events'
import type { Event } from '../../lib/events'
import { getAllCamps } from '../../lib/camps'
import type { CampEntry } from '../../lib/camps'
import { generateFlyerPdf } from '../../lib/pdf/flyer-pdf'

const BASE_DOMAIN = 'https://smj-wegweiser.de'

export async function getStaticPaths() {
  const [events, camps] = await Promise.all([eventProvider.getEvents(), getAllCamps()])

  const paths: {
    params: { id: string }
    props: { eventData?: Event; campData?: CampEntry }
  }[] = []
  const seen = new Set<string>()

  // 1. Events
  for (const event of events) {
    const variants = getSlugVariants(event.slug, event.title, event.start.getFullYear())
    for (const slug of variants) {
      if (!seen.has(slug)) {
        seen.add(slug)
        paths.push({
          params: { id: slug },
          props: { eventData: event },
        })
      }
    }
  }

  // 2. Camps
  for (const camp of camps) {
    const campSlug = `zeltlager-${camp.data.year}`
    if (!seen.has(campSlug)) {
      seen.add(campSlug)
      paths.push({
        params: { id: campSlug },
        props: { campData: camp },
      })
    }
  }

  if (camps.length > 0 && !seen.has('zeltlager')) {
    seen.add('zeltlager')
    paths.push({
      params: { id: 'zeltlager' },
      props: { campData: camps[0] },
    })
  }

  return paths
}

export const GET: APIRoute = async ({ params, props }) => {
  const { eventData, campData } = props as { eventData?: Event; campData?: CampEntry }
  const id = params.id || 'flyer'

  let title = 'Aktion & Abenteuer der SMJ'
  let subtitle = 'Raus. Ins Abenteuer.'
  let categoryLabel = 'Aktion'
  let dateStr = 'Demnächst'
  let locationStr = 'Wiesental bei Thalwenden'
  let ageStr = 'Jungs von 9–14 Jahren'
  let priceStr = 'Auf Anfrage'
  let targetUrl = `${BASE_DOMAIN}/abenteuer/`
  let highlights = [
    { title: 'Gemeinschaft & Lagerfeuer', desc: 'Zelte bauen, Nachtwache halten und neue Freunde finden.' },
    { title: 'Großes Geländespiel & Action', desc: 'Spannende Wettkämpfe, Abenteuer im Wald und Workshops.' },
    { title: 'Erfahrene Betreuung', desc: 'Jugend leitet Jugend mit Vollverpflegung und erfahrenen Leitern.' },
  ]

  if (campData) {
    title = campData.data.title
    subtitle = campData.data.motto || `Sommerzeltlager ${campData.data.year}`
    categoryLabel = `Zeltlager ${campData.data.year}`
    dateStr = formatDateRange(campData.data.date.start, campData.data.date.end)
    locationStr = campData.data.location.name || 'Wiesental bei Thalwenden'
    ageStr = formatAgeRange(campData.data.age.min, campData.data.age.max) || 'Jungs von 9–14 Jahren'
    priceStr = campData.data.price || '189 €'
    targetUrl = `${BASE_DOMAIN}/abenteuer/zeltlager-${campData.data.year}/`
    highlights = [
      { title: '10 Tage Zeltlager & Lagerfeuer', desc: 'Zelte bauen, Nachtwache halten & Geschichten am Feuer.' },
      { title: 'Großes Geländespiel & Mottotage', desc: 'Spannende Wettkämpfe, Workshops & Badespaß.' },
      { title: 'Erfahrene Leiterrunde', desc: 'Rundum betreut mit Vollverpflegung aus der Lagerküche.' },
    ]
  } else if (eventData) {
    title = eventData.title
    subtitle = eventData.teaser || 'Ein Wochenende voller Action, Natur und starker Gemeinschaft.'
    categoryLabel =
      eventData.category === 'weekend'
        ? 'Aktionswochenende'
        : eventData.category === 'camp'
          ? 'Zeltlager'
          : 'Sonderaktion'
    dateStr = formatDateRange(eventData.start, eventData.end)
    locationStr = eventData.location || 'Klause 2.0, Heiligenstadt'
    ageStr = formatAgeRange(eventData.ageMin, eventData.ageMax) || 'Jungs von 9–14 Jahren'
    priceStr = eventData.price || 'Inkl. Verpflegung'
    targetUrl = `${BASE_DOMAIN}/abenteuer/${eventData.slug}/`

    if (eventData.highlights && eventData.highlights.length > 0) {
      highlights = eventData.highlights.slice(0, 3).map((h) => ({
        title: h,
        desc: 'Alle Details und Ablaufzeiten auf unserer Website.',
      }))
    }
  }

  const pdfBytes = await generateFlyerPdf({
    title,
    subtitle,
    categoryLabel,
    dateStr,
    locationStr,
    ageStr,
    priceStr,
    highlights,
    targetUrl,
  })

  // Return real application/pdf binary response
  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="SMJ-Flyer-${id}.pdf"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
