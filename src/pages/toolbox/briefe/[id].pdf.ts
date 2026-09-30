import type { APIRoute } from 'astro'
import { eventProvider, getSlugVariants, formatDateRange, formatAgeRange } from '../../../lib/events'
import { getAllCamps } from '../../../lib/camps'
import { generateSingleLetterPdf, generateLetterBatchPdf } from '../../../lib/pdf/letter-pdf'
import { getGroupRecipients } from '../../../lib/civicrm/client'
import type { CampaignEventData, CiviRecipient } from '../../../lib/civicrm/types'
import { QR_BASE_URL } from '../../../lib/qr-url'

export async function getStaticPaths() {
  const [events, camps] = await Promise.all([eventProvider.getEvents(), getAllCamps()])
  // Default smart group 12 (Alter 9-15)
  const defaultRecipients = await getGroupRecipients(12)

  const paths: {
    params: { id: string }
    props: {
      campaignEvent: CampaignEventData
      recipients: CiviRecipient[]
      isBatch: boolean
    }
  }[] = []

  const seen = new Set<string>()

  // 1. Camps
  for (const camp of camps) {
    const slug = `zeltlager-${camp.data.year}`
    const eventData: CampaignEventData = {
      id: slug,
      title: camp.data.title.toUpperCase(),
      subtitle: (camp.data.motto || `SOMMERZELTLAGER ${camp.data.year}`).toUpperCase(),
      category: 'ZELTLAGER',
      dateStr: formatDateRange(camp.data.date.start, camp.data.date.end),
      locationStr: camp.data.location?.name || 'WIESENTHAL BEI THALWENDEN',
      ageStr: formatAgeRange(camp.data.age?.min, camp.data.age?.max) || '9 - 14 JAHRE',
      priceStr: '190 €',
      registrationUrl: `${QR_BASE_URL}/abenteuer/${slug}/`,
    }

    // Muster-Brief
    if (!seen.has(`${slug}-muster`)) {
      seen.add(`${slug}-muster`)
      paths.push({
        params: { id: `${slug}-muster` },
        props: {
          campaignEvent: eventData,
          recipients: defaultRecipients.slice(0, 1),
          isBatch: false,
        },
      })
    }

    // Batch-Druck
    if (!seen.has(`${slug}-batch`)) {
      seen.add(`${slug}-batch`)
      paths.push({
        params: { id: `${slug}-batch` },
        props: {
          campaignEvent: eventData,
          recipients: defaultRecipients,
          isBatch: true,
        },
      })
    }
  }

  // 2. Events
  for (const event of events) {
    const variants = getSlugVariants(event.slug, event.title, event.start.getFullYear())
    for (const slug of variants) {
      const eventData: CampaignEventData = {
        id: slug,
        title: event.title.toUpperCase(),
        subtitle: (event.teaser || 'AKTION DER SMJ REGIO WEGWEISER').toUpperCase(),
        category: event.category === 'weekend' ? 'WOCHENENDE' : 'AKTION',
        dateStr: formatDateRange(event.start, event.end),
        locationStr: (event.location || 'KLAUSE 2.0, HEILIGENSTADT').toUpperCase(),
        ageStr: (formatAgeRange(event.ageMin, event.ageMax) || '9 - 14 JAHRE').toUpperCase(),
        priceStr: event.price
          ? event.price.toUpperCase()
          : event.category === 'weekend'
            ? 'INKL. VERPFLEGUNG'
            : 'AUF ANFRAGE',
        registrationUrl: `${QR_BASE_URL}/abenteuer/${slug}/`,
      }

      if (!seen.has(`${slug}-muster`)) {
        seen.add(`${slug}-muster`)
        paths.push({
          params: { id: `${slug}-muster` },
          props: {
            campaignEvent: eventData,
            recipients: defaultRecipients.slice(0, 1),
            isBatch: false,
          },
        })
      }

      if (!seen.has(`${slug}-batch`)) {
        seen.add(`${slug}-batch`)
        paths.push({
          params: { id: `${slug}-batch` },
          props: {
            campaignEvent: eventData,
            recipients: defaultRecipients,
            isBatch: true,
          },
        })
      }
    }
  }

  return paths
}

export const GET: APIRoute = async ({ props }) => {
  const { campaignEvent, recipients, isBatch } = props as {
    campaignEvent: CampaignEventData
    recipients: CiviRecipient[]
    isBatch: boolean
  }

  let pdfBytes: Uint8Array
  if (isBatch) {
    pdfBytes = await generateLetterBatchPdf(recipients, campaignEvent)
  } else {
    pdfBytes = await generateSingleLetterPdf(recipients[0]!, campaignEvent)
  }

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="anschreiben-${campaignEvent.id}${isBatch ? '-batch' : ''}.pdf"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
