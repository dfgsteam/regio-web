import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ScheduleEventItem {
  title: string
  dateStr: string
  location?: string
  ageGroup?: string
  category?: string
}

export interface SchedulePdfOptions {
  periodTitle: string
  periodSubtitle?: string
  events: ScheduleEventItem[]
  targetUrl?: string
  calendarUrl?: string
  notes?: string
}

function cleanText(text: string): string {
  return text
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[•·]/g, '-')
    .replace(/[“”„]/g, '"')
    .replace(/[’']/g, "'")
    .replace(/[➔➜➝→]/g, '->')
    .replace(/[↑▲]/g, '^')
    .replace(/[★☆]/g, '*')
}

function loadFontBuffer(filename: string): Buffer {
  const possiblePaths = [
    path.resolve(process.cwd(), 'src/assets/fonts', filename),
    fileURLToPath(new URL(`../../assets/fonts/${filename}`, import.meta.url)),
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p)
    }
  }
  throw new Error(`Font file not found: ${filename}`)
}

/**
 * Generates a DIN A6 (105 x 148 mm) multi-page vector PDF for an event schedule / termincard.
 */
export async function generateSchedulePdf(options: SchedulePdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  doc.setTitle(`SMJ Termine: ${cleanText(options.periodTitle)}`)
  doc.setAuthor('SMJ Regio Wegweiser')
  doc.setCreator('SMJ Regio Wegweiser Leiter-Toolbox')

  // DIN A6: 105mm x 148mm = 297.64 x 419.53 pt
  const W = 297.64
  const H = 419.53
  const marginX = 18
  const contentW = W - 2 * marginX // 261.64 pt

  // Colors
  const cForest = rgb(17 / 255, 23 / 255, 19 / 255) // #111713
  const cPaper = rgb(241 / 255, 235 / 255, 221 / 255) // #F1EBDD
  const cOrange = rgb(255 / 255, 90 / 255, 31 / 255) // #FF5A1F
  const cSand = rgb(201 / 255, 186 / 255, 153 / 255) // #C9BA99
  const cWhite = rgb(1, 1, 1)
  const cMuted = rgb(110 / 255, 115 / 255, 108 / 255)

  // 1. Embed Brand Fonts (Anton for Display, Caveat for Handwriting, Space Mono for Utility, Inter for Body)
  let fontDisplay: PDFFont
  let fontHand: PDFFont
  let fontMono: PDFFont
  let fontBody: PDFFont

  try {
    fontDisplay = await doc.embedFont(loadFontBuffer('Anton-Regular.ttf'))
  } catch (err) {
    console.error('[schedule-pdf] Failed to load Anton-Regular.ttf:', err)
    fontDisplay = await doc.embedFont(StandardFonts.HelveticaBold)
  }

  try {
    fontHand = await doc.embedFont(loadFontBuffer('Caveat-Bold.ttf'))
  } catch (err) {
    console.error('[schedule-pdf] Failed to load Caveat-Bold.ttf:', err)
    fontHand = await doc.embedFont(StandardFonts.HelveticaBoldOblique)
  }

  try {
    fontMono = await doc.embedFont(loadFontBuffer('SpaceMono-Bold.ttf'))
  } catch (err) {
    console.error('[schedule-pdf] Failed to load SpaceMono-Bold.ttf:', err)
    fontMono = await doc.embedFont(StandardFonts.CourierBold)
  }

  try {
    fontBody = await doc.embedFont(loadFontBuffer('Inter-Regular.ttf'))
  } catch (err) {
    console.error('[schedule-pdf] Failed to load Inter-Regular.ttf:', err)
    fontBody = await doc.embedFont(StandardFonts.Helvetica)
  }

  // Generate QR code for targetUrl
  const targetUrl = options.targetUrl || 'https://smj-wegweiser.de/abenteuer/'
  const qrPngBuffer = await QRCode.toBuffer(targetUrl, {
    margin: 1,
    width: 400,
    color: { dark: '#111713', light: '#FFFFFF' },
  })
  const qrImage = await doc.embedPng(qrPngBuffer)

  // Load logo if available
  let logoImage
  try {
    if (fs.existsSync('public/logo_wegweiser_dark.png')) {
      const logoPngBuffer = fs.readFileSync('public/logo_wegweiser_dark.png')
      logoImage = await doc.embedPng(logoPngBuffer)
    }
  } catch {
    // fallback without logo image
  }

  const allEvents = options.events || []

  // Pagination calculation:
  // Single page: up to 5 events fit with the bottom QR box
  // Multi-page: page 1 fits ~7 events, last page fits ~5 events + QR box
  const eventsPerPageFirst = allEvents.length <= 5 ? allEvents.length : 6
  const pagesData: ScheduleEventItem[][] = []

  if (allEvents.length <= 5) {
    pagesData.push(allEvents)
  } else {
    pagesData.push(allEvents.slice(0, eventsPerPageFirst))
    let remaining = allEvents.slice(eventsPerPageFirst)
    while (remaining.length > 0) {
      pagesData.push(remaining.slice(0, 6))
      remaining = remaining.slice(6)
    }
  }

  const totalPages = Math.max(1, pagesData.length)

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const page = doc.addPage([W, H])
    const isFirstPage = pageIdx === 0
    const isLastPage = pageIdx === totalPages - 1
    const pageEvents = pagesData[pageIdx] || []

    // 1. Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: W,
      height: H,
      color: cPaper,
    })

    // Decorative expedition borders
    page.drawRectangle({
      x: 8,
      y: 8,
      width: W - 16,
      height: H - 16,
      borderColor: cForest,
      borderWidth: 1.5,
    })

    page.drawRectangle({
      x: 11,
      y: 11,
      width: W - 22,
      height: H - 22,
      borderColor: cSand,
      borderWidth: 0.5,
    })

    let currY = H - 22

    // 2. Header
    if (isFirstPage) {
      const logoSize = 28
      if (logoImage) {
        page.drawImage(logoImage, {
          x: marginX,
          y: currY - logoSize,
          width: logoSize,
          height: logoSize,
        })
      }

      const headerTextX = logoImage ? marginX + logoSize + 8 : marginX

      page.drawText('SMJ REGIO WEGWEISER', {
        x: headerTextX,
        y: currY - 9,
        size: 7,
        font: fontMono,
        color: cOrange,
      })

      page.drawText('Katholische Schoenstatt-Mannesjugend', {
        x: headerTextX,
        y: currY - 18,
        size: 5.5,
        font: fontBody,
        color: cMuted,
      })

      // Badge top right
      const badgeStr = 'TERMINKALENDER'
      const badgeW = fontMono.widthOfTextAtSize(badgeStr, 6.5) + 10
      page.drawRectangle({
        x: W - marginX - badgeW,
        y: currY - 16,
        width: badgeW,
        height: 14,
        color: cForest,
      })
      page.drawText(badgeStr, {
        x: W - marginX - badgeW + 5,
        y: currY - 12,
        size: 6.5,
        font: fontMono,
        color: cWhite,
      })

      currY -= logoSize + 6

      // Title & Period Headline
      page.drawLine({
        start: { x: marginX, y: currY },
        end: { x: W - marginX, y: currY },
        thickness: 1.5,
        color: cForest,
      })

      currY -= 14

      page.drawText('// RAUS. INS ABENTEUER.', {
        x: marginX,
        y: currY,
        size: 8,
        font: fontHand,
        color: cOrange,
      })

      currY -= 14

      const titleStr = cleanText(options.periodTitle.toUpperCase())
      const titleSize = titleStr.length > 25 ? 12 : 14
      page.drawText(titleStr, {
        x: marginX,
        y: currY,
        size: titleSize,
        font: fontDisplay,
        color: cForest,
      })

      currY -= titleSize + 2

      if (options.periodSubtitle) {
        page.drawText(cleanText(options.periodSubtitle), {
          x: marginX,
          y: currY,
          size: 8.5,
          font: fontHand,
          color: cMuted,
        })
        currY -= 12
      } else {
        currY -= 4
      }
    } else {
      // Subsequent page compact header
      page.drawText('SMJ REGIO WEGWEISER - TERMINKALENDER', {
        x: marginX,
        y: currY - 6,
        size: 6.5,
        font: fontMono,
        color: cOrange,
      })

      page.drawText(`Fortsetzung (${pageIdx + 1}/${totalPages})`, {
        x: W - marginX - fontMono.widthOfTextAtSize(`Fortsetzung (${pageIdx + 1}/${totalPages})`, 6),
        y: currY - 6,
        size: 6,
        font: fontMono,
        color: cMuted,
      })

      currY -= 12
      page.drawLine({
        start: { x: marginX, y: currY },
        end: { x: W - marginX, y: currY },
        thickness: 1,
        color: cForest,
      })
      currY -= 12
    }

    // 3. Events List for this page
    const itemHeight = isFirstPage && isLastPage && pageEvents.length <= 4 ? 38 : 34

    for (let i = 0; i < pageEvents.length; i++) {
      const ev = pageEvents[i]
      if (!ev) continue

      // Left orange accent pip
      page.drawRectangle({
        x: marginX,
        y: currY - 14,
        width: 2.5,
        height: 16,
        color: cOrange,
      })

      // Date string
      page.drawText(cleanText(ev.dateStr.toUpperCase()), {
        x: marginX + 6,
        y: currY - 3,
        size: 6.8,
        font: fontMono,
        color: cOrange,
      })

      // Title
      let evTitle = cleanText(ev.title.toUpperCase())
      if (evTitle.length > 34) {
        evTitle = evTitle.substring(0, 33) + '...'
      }
      page.drawText(evTitle, {
        x: marginX + 6,
        y: currY - 13,
        size: 9.5,
        font: fontDisplay,
        color: cForest,
      })

      // Location & Age
      const locAgeParts: string[] = []
      if (ev.location) locAgeParts.push(ev.location)
      if (ev.ageGroup) locAgeParts.push(ev.ageGroup)
      let metaStr = cleanText(locAgeParts.join('  -  '))
      if (metaStr.length > 44) {
        metaStr = metaStr.substring(0, 43) + '..'
      }
      if (metaStr) {
        page.drawText(metaStr, {
          x: marginX + 6,
          y: currY - 22,
          size: 6.2,
          font: fontBody,
          color: cMuted,
        })
      }

      // Thin separator line
      if (i < pageEvents.length - 1) {
        page.drawLine({
          start: { x: marginX, y: currY - itemHeight + 6 },
          end: { x: W - marginX, y: currY - itemHeight + 6 },
          thickness: 0.5,
          color: cSand,
        })
      }

      currY -= itemHeight
    }

    // 4. Bottom Call-to-Action Box (on last page)
    if (isLastPage) {
      const footerY = 20
      const boxBottomY = footerY + 8
      const boxH = Math.max(76, currY - boxBottomY)
      const boxY = boxBottomY

      page.drawRectangle({
        x: marginX,
        y: boxY,
        width: contentW,
        height: boxH,
        color: cWhite,
        borderColor: cForest,
        borderWidth: 1.5,
      })

      const innerX = marginX + 10
      let innerY = boxY + boxH - 12

      // Orange badge
      page.drawRectangle({
        x: innerX,
        y: innerY - 10,
        width: 110,
        height: 12,
        color: cOrange,
      })
      page.drawText('INFOS & ANMELDUNG', {
        x: innerX + 6,
        y: innerY - 6.5,
        size: 5.5,
        font: fontMono,
        color: cForest,
      })

      innerY -= 22

      page.drawText('Alle Termine & Anmeldung online:', {
        x: innerX,
        y: innerY,
        size: 6.5,
        font: fontBody,
        color: cForest,
      })

      innerY -= 11

      const shortDomain = cleanText(targetUrl.replace(/^https?:\/\//, ''))
      page.drawText(`-> ${shortDomain}`, {
        x: innerX,
        y: innerY,
        size: 7.5,
        font: fontMono,
        color: cOrange,
      })

      innerY -= 12

      page.drawText('Kalender abonnieren (iCal / Google):', {
        x: innerX,
        y: innerY,
        size: 5.5,
        font: fontBody,
        color: cMuted,
      })

      innerY -= 9

      page.drawText('smj-wegweiser.de/api/calendar.ics', {
        x: innerX,
        y: innerY,
        size: 5.5,
        font: fontMono,
        color: cForest,
      })

      // Right QR Code
      const qrSize = Math.min(54, boxH - 16)
      const qrX = W - marginX - qrSize - 8
      const qrY = boxY + (boxH - qrSize) / 2

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      })

      page.drawText('HIER SCANNEN ^', {
        x: qrX + 6,
        y: qrY - 7,
        size: 4.8,
        font: fontMono,
        color: cForest,
      })
    }

    // 5. Page Footer
    const footerY = 16
    page.drawText(
      `SMJ Regio Wegweiser - Jugend leitet Jugend - Stand: ${new Date().getFullYear()}`,
      {
        x: marginX,
        y: footerY,
        size: 5,
        font: fontBody,
        color: cMuted,
      },
    )

    const pageNotice = `SEITE ${pageIdx + 1} / ${totalPages}`
    page.drawText(pageNotice, {
      x: W - marginX - fontMono.widthOfTextAtSize(pageNotice, 5),
      y: footerY,
      size: 5,
      font: fontMono,
      color: cForest,
    })
  }

  return await doc.save()
}

/**
 * Builds standard schedule presets for build-time static routes and UI dropdowns.
 */
export function buildSchedulePresets(events: any[], camps: any[]): Record<string, SchedulePdfOptions & { id: string; filename: string }> {
  const allItems: {
    start: Date
    end: Date
    title: string
    dateStr: string
    location?: string
    ageGroup?: string
    category: string
  }[] = []

  // Camps
  for (const c of camps) {
    const start = new Date(c.data.date.start)
    const end = new Date(c.data.date.end)
    allItems.push({
      start,
      end,
      title: `${c.data.title}${c.data.motto ? ` – ${c.data.motto}` : ''}`,
      dateStr: `${start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}.–${end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
      location: c.data.location?.name || 'Wiesental bei Thalwenden',
      ageGroup: `${c.data.age?.min || 9}–${c.data.age?.max || 14} Jahre`,
      category: 'camp',
    })
  }

  // Events
  for (const e of events) {
    const start = new Date(e.start)
    const end = new Date(e.end)
    const sameDay = start.toDateString() === end.toDateString()
    const dateStr = sameDay
      ? start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : `${start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}.–${end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`

    allItems.push({
      start,
      end,
      title: e.title,
      dateStr,
      location: e.location || 'Klause 2.0, Heiligenstadt',
      ageGroup: e.ageMin ? `${e.ageMin}–${e.ageMax || 15} Jahre` : undefined,
      category: e.category || 'event',
    })
  }

  // Sort chronologically ascending
  allItems.sort((a, b) => a.start.getTime() - b.start.getTime())

  const now = new Date()

  // 1. Upcoming 6 Months
  const sixMonthsLater = new Date(now.getTime() + 180 * 86400000)
  const upcomingEvents = allItems
    .filter((it) => it.end >= now && it.start <= sixMonthsLater)
    .map(({ title, dateStr, location, ageGroup, category }) => ({ title, dateStr, location, ageGroup, category }))

  // 2. Year 2026
  const events2026 = allItems
    .filter((it) => it.start.getFullYear() === 2026)
    .map(({ title, dateStr, location, ageGroup, category }) => ({ title, dateStr, location, ageGroup, category }))

  // 3. Year 2027
  const events2027 = allItems
    .filter((it) => it.start.getFullYear() === 2027)
    .map(({ title, dateStr, location, ageGroup, category }) => ({ title, dateStr, location, ageGroup, category }))

  // 4. H1 2026
  const eventsH12026 = allItems
    .filter((it) => it.start.getFullYear() === 2026 && it.start.getMonth() < 6)
    .map(({ title, dateStr, location, ageGroup, category }) => ({ title, dateStr, location, ageGroup, category }))

  // 5. H2 2026
  const eventsH22026 = allItems
    .filter((it) => it.start.getFullYear() === 2026 && it.start.getMonth() >= 6)
    .map(({ title, dateStr, location, ageGroup, category }) => ({ title, dateStr, location, ageGroup, category }))

  return {
    'terminkarte': {
      id: 'terminkarte',
      filename: 'terminkarte.pdf',
      periodTitle: 'Kommende Termine',
      periodSubtitle: 'Die naechsten Monate im Ueberblick',
      events: upcomingEvents.length > 0 ? upcomingEvents : events2026.slice(0, 6),
      targetUrl: 'https://smj-wegweiser.de/abenteuer/',
    },
    'terminkarte-2026': {
      id: 'terminkarte-2026',
      filename: 'terminkarte-2026.pdf',
      periodTitle: 'Jahreskalender 2026',
      periodSubtitle: 'Alle Aktionen und Zeltlager im Jahr 2026',
      events: events2026,
      targetUrl: 'https://smj-wegweiser.de/abenteuer/',
    },
    'terminkarte-2027': {
      id: 'terminkarte-2027',
      filename: 'terminkarte-2027.pdf',
      periodTitle: 'Jahreskalender 2027',
      periodSubtitle: 'Vorschau auf die Aktionen und Zeltlager 2027',
      events: events2027,
      targetUrl: 'https://smj-wegweiser.de/abenteuer/',
    },
    'terminkarte-h1-2026': {
      id: 'terminkarte-h1-2026',
      filename: 'terminkarte-h1-2026.pdf',
      periodTitle: '1. Halbjahr 2026',
      periodSubtitle: 'Aktionen von Januar bis Juni 2026',
      events: eventsH12026,
      targetUrl: 'https://smj-wegweiser.de/abenteuer/',
    },
    'terminkarte-h2-2026': {
      id: 'terminkarte-h2-2026',
      filename: 'terminkarte-h2-2026.pdf',
      periodTitle: '2. Halbjahr 2026',
      periodSubtitle: 'Sommerzeltlager & Aktionen Juli bis Dezember 2026',
      events: eventsH22026,
      targetUrl: 'https://smj-wegweiser.de/abenteuer/',
    },
  }
}
