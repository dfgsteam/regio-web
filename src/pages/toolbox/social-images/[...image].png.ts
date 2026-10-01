import type { APIRoute } from 'astro'
import '../../../lib/server-fonts'
import { ensureServerFontsConfigured } from '../../../lib/server-fonts'
import { eventProvider, getSlugVariants, formatDateRange, formatAgeRange } from '../../../lib/events'
import { getAllCamps } from '../../../lib/camps'
import { buildSchedulePresets } from '../../../lib/pdf/schedule-pdf'
import {
  generateEventSocialSvg,
  generateScheduleSlideSvg,
  renderSvgToPng,
  type EventSocialOptions,
  type ScheduleSlideSocialOptions,
} from '../../../lib/social/social-image-generator'

import { QR_BASE_URL as BASE_DOMAIN } from '../../../lib/qr-url'

export async function getStaticPaths() {
  ensureServerFontsConfigured()
  const [events, camps] = await Promise.all([eventProvider.getEvents(), getAllCamps()])

  const paths: {
    params: { image: string }
    props: {
      eventOptions?: EventSocialOptions
      slideOptions?: ScheduleSlideSocialOptions
    }
  }[] = []
  const seen = new Set<string>()

  const eventFormats: ('story' | 'post' | 'post-slide-1' | 'post-slide-2' | 'whatsapp' | 'portrait')[] = [
    'story',
    'post',
    'post-slide-1',
    'post-slide-2',
    'whatsapp',
    'portrait',
  ]
  const eventThemes: ('dark' | 'light' | 'orange' | 'black')[] = ['dark', 'light', 'orange', 'black']

  // 1. Single Events & Camps Social Images
  // A) Events
  for (const event of events) {
    const variants = getSlugVariants(event.slug, event.title, event.start.getFullYear())
    for (const slug of variants) {
      for (const format of eventFormats) {
        for (const theme of eventThemes) {
          const imgKey = `${slug}-${format}-${theme}`
          if (!seen.has(imgKey)) {
            seen.add(imgKey)
            paths.push({
              params: { image: imgKey },
              props: {
                eventOptions: {
                  format,
                  theme,
                  title: event.title,
                  subtitle: event.teaser || 'Raus. Ins Abenteuer.',
                  categoryLabel:
                    event.category === 'weekend'
                      ? 'Wochenende'
                      : event.category === 'camp'
                        ? 'Zeltlager'
                        : 'Sonderaktion',
                  dateStr: formatDateRange(event.start, event.end),
                  locationStr: event.location || 'Klause 2.0, Heiligenstadt',
                  ageStr: formatAgeRange(event.ageMin, event.ageMax) || 'Jungs von 9–14 Jahren',
                  priceStr: event.price || 'Inkl. Verpflegung',
                  highlights: event.highlights && event.highlights.length > 0 ? event.highlights : undefined,
                  targetUrl: `${BASE_DOMAIN}/abenteuer/${event.slug}/`,
                },
              },
            })
          }
        }
      }
    }
  }

  // B) Camps
  for (const camp of camps) {
    const campSlugs = [`zeltlager-${camp.data.year}`, 'zeltlager']
    for (const slug of campSlugs) {
      for (const format of eventFormats) {
        for (const theme of eventThemes) {
          const imgKey = `${slug}-${format}-${theme}`
          if (!seen.has(imgKey)) {
            seen.add(imgKey)
            paths.push({
              params: { image: imgKey },
              props: {
                eventOptions: {
                  format,
                  theme,
                  title: camp.data.title,
                  subtitle: camp.data.motto || `Sommerzeltlager ${camp.data.year}`,
                  categoryLabel: `Zeltlager ${camp.data.year}`,
                  dateStr: formatDateRange(camp.data.date.start, camp.data.date.end),
                  locationStr: camp.data.location.name || 'Wiesental bei Thalwenden',
                  ageStr: formatAgeRange(camp.data.age.min, camp.data.age.max) || 'Jungs von 9–14 Jahren',
                  priceStr: camp.data.price || '189 €',
                  highlights: [
                    '10 Tage Zeltstadt & Lagerfeuer',
                    'Große Geländespiele & Waldabenteuer',
                    'Jugend leitet Jugend & Vollverpflegung',
                  ],
                  targetUrl: `${BASE_DOMAIN}/abenteuer/zeltlager-${camp.data.year}/`,
                },
              },
            })
          }
        }
      }
    }
  }

  // C) Custom fallback
  for (const format of eventFormats) {
    for (const theme of eventThemes) {
      const imgKey = `custom-${format}-${theme}`
      if (!seen.has(imgKey)) {
        seen.add(imgKey)
        paths.push({
          params: { image: imgKey },
          props: {
            eventOptions: {
              format,
              theme,
              title: 'Aktion & Abenteuer',
              subtitle: 'Raus. Ins Abenteuer.',
              categoryLabel: 'Aktion',
              dateStr: 'Demnächst',
              locationStr: 'Klause 2.0 / Eichsfeld',
              ageStr: 'Jungs von 9–14 Jahren',
              priceStr: 'Auf Anfrage',
              targetUrl: `${BASE_DOMAIN}/abenteuer/`,
            },
          },
        })
      }
    }
  }

  // 2. Schedule Carousel Slides (Terminkarten)
  const schedulePresets = buildSchedulePresets(events, camps)
  const slideFormats: ('story' | 'post')[] = ['story', 'post']
  const slideThemes: ('dark' | 'light')[] = ['dark', 'light']

  for (const [presetKey, preset] of Object.entries(schedulePresets)) {
    const evList = preset.events || []
    const totalSlides = evList.length <= 4 ? 2 : 3

    for (let slideIdx = 0; slideIdx < totalSlides; slideIdx++) {
      let slideEvents = evList
      if (totalSlides === 3) {
        if (slideIdx === 0) {
          slideEvents = evList.slice(0, Math.ceil(evList.length / 2))
        } else if (slideIdx === 1) {
          slideEvents = evList.slice(Math.ceil(evList.length / 2))
        } else {
          slideEvents = []
        }
      } else {
        if (slideIdx === 1) {
          slideEvents = []
        }
      }

      for (const format of slideFormats) {
        for (const theme of slideThemes) {
          const imgKey = `${presetKey}-slide-${slideIdx}-${format}-${theme}`
          if (!seen.has(imgKey)) {
            seen.add(imgKey)
            paths.push({
              params: { image: imgKey },
              props: {
                slideOptions: {
                  format,
                  theme,
                  periodTitle: preset.periodTitle,
                  periodSubtitle: preset.periodSubtitle,
                  slideIndex: slideIdx,
                  totalSlides,
                  events: slideEvents,
                  targetUrl: preset.targetUrl || `${BASE_DOMAIN}/abenteuer/`,
                },
              },
            })
          }
        }
      }
    }
  }

  return paths
}

export const GET: APIRoute = async ({ props, request, url }) => {
  const { eventOptions, slideOptions } = (props || {}) as {
    eventOptions?: EventSocialOptions
    slideOptions?: ScheduleSlideSocialOptions
  }

  const customUrlParam = url?.searchParams?.get('url')
  const host =
    request?.headers?.get('x-forwarded-host') ||
    request?.headers?.get('host') ||
    url?.host
  const proto =
    request?.headers?.get('x-forwarded-proto') ||
    (url?.protocol ? url.protocol.replace(':', '') : 'https')

  function resolveTargetUrl(original?: string): string | undefined {
    if (customUrlParam) return customUrlParam
    if (!original) return original
    try {
      const u = new URL(original)
      if (host) {
        u.host = host
        u.protocol = proto
      }
      return u.toString()
    } catch {
      return original
    }
  }

  let pngBuffer: Buffer

  if (eventOptions) {
    const effectiveOptions: EventSocialOptions = {
      ...eventOptions,
      targetUrl: resolveTargetUrl(eventOptions.targetUrl) || eventOptions.targetUrl,
    }
    const svg = await generateEventSocialSvg(effectiveOptions)
    pngBuffer = await renderSvgToPng(svg)
  } else if (slideOptions) {
    const effectiveOptions: ScheduleSlideSocialOptions = {
      ...slideOptions,
      targetUrl: resolveTargetUrl(slideOptions.targetUrl) || slideOptions.targetUrl,
    }
    const svg = await generateScheduleSlideSvg(effectiveOptions)
    pngBuffer = await renderSvgToPng(svg)
  } else {
    return new Response('Not found', { status: 404 })
  }

  return new Response(Buffer.from(pngBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
