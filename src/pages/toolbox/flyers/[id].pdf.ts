import type { APIRoute } from 'astro'
import { eventProvider, getSlugVariants } from '../../../lib/events'
import type { Event } from '../../../lib/events'
import { getAllCamps } from '../../../lib/camps'
import type { CampEntry } from '../../../lib/camps'
import { generateFlyerPdf } from '../../../lib/pdf/flyer-pdf'
import { resolveFlyerData } from '../../../lib/pdf/flyer-content'
import { generateSchedulePdf, buildSchedulePresets, type SchedulePdfOptions } from '../../../lib/pdf/schedule-pdf'

export async function getStaticPaths() {
  const [events, camps] = await Promise.all([eventProvider.getEvents(), getAllCamps()])

  const paths: {
    params: { id: string }
    props: {
      slug: string
      eventData?: Event
      campData?: CampEntry
      scheduleOptions?: SchedulePdfOptions
    }
  }[] = []
  const seen = new Set<string>()

  // 1. Terminkarten / Schedule Presets (A6 Multi-Page PDFs)
  const schedulePresets = buildSchedulePresets(events, camps)
  for (const [key, preset] of Object.entries(schedulePresets)) {
    if (!seen.has(key)) {
      seen.add(key)
      paths.push({
        params: { id: key },
        props: {
          slug: key,
          scheduleOptions: preset,
        },
      })
    }
  }

  // 2. Events (A4 Single-Event Flyers)
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

  // 3. Camps
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
  const { slug, eventData, campData, scheduleOptions } = props as {
    slug: string
    eventData?: Event
    campData?: CampEntry
    scheduleOptions?: SchedulePdfOptions
  }
  const id = params.id || slug || 'flyer'

  // If this is a schedule preset, generate the A6 multi-page schedule PDF
  if (scheduleOptions) {
    const pdfBytes = await generateSchedulePdf(scheduleOptions)
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="SMJ-Terminkarte-${id}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // Otherwise generate the A4 single-event flyer PDF
  const resolvedData = resolveFlyerData(id, eventData, campData)
  const pdfBytes = await generateFlyerPdf(resolvedData)

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="SMJ-Flyer-${id}.pdf"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
