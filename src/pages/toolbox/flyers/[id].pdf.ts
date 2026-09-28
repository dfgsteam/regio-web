import type { APIRoute } from 'astro'
import { eventProvider, getSlugVariants } from '../../../lib/events'
import type { Event } from '../../../lib/events'
import { getAllCamps } from '../../../lib/camps'
import type { CampEntry } from '../../../lib/camps'
import { generateFlyerPdf } from '../../../lib/pdf/flyer-pdf'
import { resolveFlyerData } from '../../../lib/pdf/flyer-content'

export async function getStaticPaths() {
  const [events, camps] = await Promise.all([eventProvider.getEvents(), getAllCamps()])

  const paths: {
    params: { id: string }
    props: { slug: string; eventData?: Event; campData?: CampEntry }
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
          props: { slug, eventData: event },
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
        props: { slug: campSlug, campData: camp },
      })
    }
  }

  if (camps.length > 0 && !seen.has('zeltlager')) {
    seen.add('zeltlager')
    paths.push({
      params: { id: 'zeltlager' },
      props: { slug: 'zeltlager', campData: camps[0] },
    })
  }

  return paths
}

export const GET: APIRoute = async ({ params, props }) => {
  const { slug, eventData, campData } = props as {
    slug: string
    eventData?: Event
    campData?: CampEntry
  }
  const id = params.id || slug || 'flyer'

  const resolvedData = resolveFlyerData(id, eventData, campData)
  const pdfBytes = await generateFlyerPdf(resolvedData)

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
