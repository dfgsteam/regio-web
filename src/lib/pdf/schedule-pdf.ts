import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QR_BASE_URL } from '../qr-url'

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
  theme?: 'light' | 'dark'
}

function cleanText(text?: string | null): string {
  if (!text) return ''
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

  const isDark = options.theme === 'dark'

  // Colors based on theme
  const cForest = rgb(17 / 255, 23 / 255, 19 / 255) // #111713
  const cPaper = rgb(241 / 255, 235 / 255, 221 / 255) // #F1EBDD
  const cOrange = rgb(255 / 255, 90 / 255, 31 / 255) // #FF5A1F
  const cSand = rgb(201 / 255, 186 / 255, 153 / 255) // #C9BA99
  const cWhite = rgb(1, 1, 1)

  const cBg = isDark ? cForest : cPaper
  const cBorderOuter = isDark ? cOrange : cForest
  const cBorderInner = isDark ? rgb(35 / 255, 45 / 255, 37 / 255) : cSand
  const cTextPrimary = isDark ? cPaper : cForest
  const cTextMuted = isDark ? rgb(160 / 255, 170 / 255, 155 / 255) : rgb(50 / 255, 60 / 255, 52 / 255)
  const cBoxBg = isDark ? rgb(24 / 255, 32 / 255, 25 / 255) : cWhite
  const cBoxBorder = isDark ? cOrange : cForest
  const cBoxText = isDark ? cPaper : cForest
  const cBadgeBg = isDark ? cOrange : cForest
  const cBadgeText = isDark ? cForest : cWhite

  // 1. Embed Brand Fonts
  let fontDisplay: PDFFont
  let fontMono: PDFFont
  let fontBody: PDFFont
  let fontBold: PDFFont

  try {
    fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  } catch {
    fontBold = await doc.embedFont(StandardFonts.Helvetica)
  }

  try {
    fontDisplay = await doc.embedFont(loadFontBuffer('Anton-Regular.ttf'))
  } catch (err) {
    fontDisplay = fontBold
  }

  try {
    fontMono = await doc.embedFont(loadFontBuffer('SpaceMono-Bold.ttf'))
  } catch (err) {
    fontMono = await doc.embedFont(StandardFonts.CourierBold)
  }

  try {
    fontBody = await doc.embedFont(loadFontBuffer('Inter-Regular.ttf'))
  } catch (err) {
    fontBody = await doc.embedFont(StandardFonts.Helvetica)
  }

  // Generate QR code for targetUrl (Always black-on-white for reliable phone scanning)
  const targetUrl = options.targetUrl || `${QR_BASE_URL}/abenteuer/`
  const qrPngBuffer = await QRCode.toBuffer(targetUrl, {
    margin: 1,
    width: 400,
    color: { dark: '#111713', light: '#FFFFFF' },
  })
  const qrImage = await doc.embedPng(qrPngBuffer)

  // Load logo if available
  let logoImage
  try {
    const logoFile = isDark ? 'public/logo_wegweiser_white.png' : 'public/logo_wegweiser_dark.png'
    if (fs.existsSync(logoFile)) {
      const logoPngBuffer = fs.readFileSync(logoFile)
      logoImage = await doc.embedPng(logoPngBuffer)
    } else if (fs.existsSync('public/logo_wegweiser_dark.png')) {
      const logoPngBuffer = fs.readFileSync('public/logo_wegweiser_dark.png')
      logoImage = await doc.embedPng(logoPngBuffer)
    }
  } catch {
    // fallback without logo image
  }

  const allEvents = options.events || []
  const totalEvents = allEvents.length

  // Balanced pagination calculation:
  // Up to 6 events fit on a single A6 page along with the bottom QR box.
  // When > 6 events, balance evenly across pages so no page is left half empty.
  const pagesData: ScheduleEventItem[][] = []

  if (totalEvents <= 6) {
    pagesData.push(allEvents)
  } else {
    const totalPages = Math.ceil(totalEvents / 6)
    const perPage = Math.ceil(totalEvents / totalPages)
    for (let p = 0; p < totalPages; p++) {
      const start = p * perPage
      const end = Math.min(totalEvents, (p + 1) * perPage)
      pagesData.push(allEvents.slice(start, end))
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
      color: cBg,
    })

    // Decorative expedition borders
    page.drawRectangle({
      x: 8,
      y: 8,
      width: W - 16,
      height: H - 16,
      borderColor: cBorderOuter,
      borderWidth: 1.5,
    })

    page.drawRectangle({
      x: 11,
      y: 11,
      width: W - 22,
      height: H - 22,
      borderColor: cBorderInner,
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
        size: 7.2,
        font: fontBold,
        color: cOrange,
      })

      page.drawText('Katholische Schoenstatt-Mannesjugend', {
        x: headerTextX,
        y: currY - 18,
        size: 5.5,
        font: fontBody,
        color: cTextMuted,
      })

      // Badge top right
      const badgeStr = 'TERMINKALENDER'
      const badgeW = fontBold.widthOfTextAtSize(badgeStr, 6.5) + 12
      page.drawRectangle({
        x: W - marginX - badgeW,
        y: currY - 16,
        width: badgeW,
        height: 14,
        color: cBadgeBg,
      })
      page.drawText(badgeStr, {
        x: W - marginX - badgeW + 6,
        y: currY - 12,
        size: 6.5,
        font: fontBold,
        color: cBadgeText,
      })

      currY -= logoSize + 6

      // Title & Period Headline
      page.drawLine({
        start: { x: marginX, y: currY },
        end: { x: W - marginX, y: currY },
        thickness: 1.5,
        color: cBorderOuter,
      })

      currY -= 13

      page.drawText('// RAUS. INS ABENTEUER.', {
        x: marginX,
        y: currY,
        size: 7.5,
        font: fontBold,
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
        color: cTextPrimary,
      })

      currY -= titleSize + 2

      if (options.periodSubtitle) {
        page.drawText(cleanText(options.periodSubtitle), {
          x: marginX,
          y: currY,
          size: 7,
          font: fontBody,
          color: cTextMuted,
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

      const fortText = `Fortsetzung (${pageIdx + 1}/${totalPages})`
      page.drawText(fortText, {
        x: W - marginX - fontMono.widthOfTextAtSize(fortText, 6),
        y: currY - 6,
        size: 6,
        font: fontMono,
        color: cTextMuted,
      })

      currY -= 12
      page.drawLine({
        start: { x: marginX, y: currY },
        end: { x: W - marginX, y: currY },
        thickness: 1,
        color: cBorderOuter,
      })
      currY -= 12
    }

    // 3. Dynamic Height & Spacing Calculation for Event Items
    const footerY = 16
    const boxBottomY = footerY + 8
    const boxH = 74
    const bottomReservedY = isLastPage ? boxBottomY + boxH + 12 : boxBottomY + 22

    const availableEventsH = Math.max(80, currY - bottomReservedY)
    const eventCount = Math.max(1, pageEvents.length)

    // Calculate optimal item height based on count
    let itemHeight = 32
    if (eventCount === 1) itemHeight = 85
    else if (eventCount === 2) itemHeight = 70
    else if (eventCount === 3) itemHeight = 58
    else if (eventCount === 4) itemHeight = 48
    else if (eventCount === 5) itemHeight = 38
    else itemHeight = 32

    const totalUsedH = itemHeight * eventCount
    const extraGap = Math.max(2, Math.floor((availableEventsH - totalUsedH) / (eventCount + 1)))

    currY -= extraGap

    for (let i = 0; i < pageEvents.length; i++) {
      const ev = pageEvents[i]
      if (!ev) continue

      // Left orange accent strip
      const barH = itemHeight >= 60 ? 26 : (itemHeight >= 45 ? 20 : 16)
      page.drawRectangle({
        x: marginX,
        y: currY - barH + 2,
        width: 2.5,
        height: barH,
        color: cOrange,
      })

      // Date string
      const dateSize = itemHeight >= 60 ? 8 : (itemHeight >= 45 ? 7.2 : 6.5)
      page.drawText(cleanText(ev.dateStr.toUpperCase()), {
        x: marginX + 6,
        y: currY - 2,
        size: dateSize,
        font: fontBold,
        color: cOrange,
      })

      // Title
      let evTitle = cleanText(ev.title.toUpperCase())
      if (evTitle.length > 34) {
        evTitle = evTitle.substring(0, 33) + '...'
      }
      const titleFSize = itemHeight >= 60 ? 12.5 : (itemHeight >= 45 ? 10.5 : 9)
      page.drawText(evTitle, {
        x: marginX + 6,
        y: currY - (itemHeight >= 60 ? 16 : (itemHeight >= 45 ? 13 : 11)),
        size: titleFSize,
        font: fontDisplay,
        color: cTextPrimary,
      })

      // Location & Age
      const locAgeParts: string[] = []
      if (ev.location) locAgeParts.push(ev.location)
      if (ev.ageGroup) locAgeParts.push(ev.ageGroup)
      let metaStr = cleanText(locAgeParts.join('  •  '))
      if (metaStr.length > 44) {
        metaStr = metaStr.substring(0, 43) + '..'
      }
      if (metaStr) {
        const metaFSize = itemHeight >= 60 ? 7.2 : (itemHeight >= 45 ? 6.5 : 5.8)
        page.drawText(metaStr, {
          x: marginX + 6,
          y: currY - (itemHeight >= 60 ? 28 : (itemHeight >= 45 ? 23 : 19)),
          size: metaFSize,
          font: fontBody,
          color: cTextMuted,
        })
      }

      // Thin separator line
      if (i < pageEvents.length - 1) {
        page.drawLine({
          start: { x: marginX, y: currY - itemHeight + 4 },
          end: { x: W - marginX, y: currY - itemHeight + 4 },
          thickness: 0.5,
          color: cBorderInner,
        })
      }

      currY -= (itemHeight + extraGap)
    }

    // Callout box if only few events to avoid empty feeling
    if (isLastPage && pageEvents.length <= 3) {
      const calloutH = 34
      const calloutY = boxBottomY + boxH + 12
      page.drawRectangle({
        x: marginX,
        y: calloutY,
        width: contentW,
        height: calloutH,
        color: isDark ? rgb(24 / 255, 32 / 255, 25 / 255) : rgb(248 / 255, 245 / 255, 238 / 255),
        borderColor: isDark ? rgb(40 / 255, 52 / 255, 43 / 255) : cBorderInner,
        borderWidth: 0.8,
      })
      page.drawText('// 100% DRAUSSEN & HANDYFREI', {
        x: marginX + 10,
        y: calloutY + calloutH - 12,
        size: 5.5,
        font: fontBold,
        color: cOrange,
      })
      page.drawText('Zeltlager, Naturerlebnisse und echte Gemeinschaft unter Jungs.', {
        x: marginX + 10,
        y: calloutY + 8,
        size: 5.5,
        font: fontBody,
        color: cTextMuted,
      })
    }

    // Notice on multi-page when Page 1 ends
    if (!isLastPage && totalPages > 1) {
      const fortText = '-> FORTSETZUNG AUF SEITE ' + (pageIdx + 2)
      const fortW = fontBold.widthOfTextAtSize(fortText, 5.8) + 16
      page.drawRectangle({
        x: marginX,
        y: boxBottomY + 2,
        width: fortW,
        height: 14,
        color: isDark ? rgb(35 / 255, 45 / 255, 37 / 255) : rgb(230 / 255, 222 / 255, 206 / 255),
        borderColor: cOrange,
        borderWidth: 0.8,
      })
      page.drawText(fortText, {
        x: marginX + 8,
        y: boxBottomY + 6,
        size: 5.8,
        font: fontBold,
        color: cOrange,
      })
    }

    // 4. Bottom Call-to-Action Box (on last page)
    if (isLastPage) {
      const boxY = boxBottomY

      page.drawRectangle({
        x: marginX,
        y: boxY,
        width: contentW,
        height: boxH,
        color: cBoxBg,
        borderColor: cBoxBorder,
        borderWidth: 1.5,
      })

      const innerX = marginX + 10
      let innerY = boxY + boxH - 12

      // Orange badge
      page.drawRectangle({
        x: innerX,
        y: innerY - 9,
        width: 110,
        height: 12,
        color: cOrange,
      })
      page.drawText('INFOS & ANMELDUNG', {
        x: innerX + 6,
        y: innerY - 5.5,
        size: 5.8,
        font: fontBold,
        color: cForest,
      })

      innerY -= 20

      page.drawText('Alle Termine & Anmeldung online:', {
        x: innerX,
        y: innerY,
        size: 6.5,
        font: fontBody,
        color: cBoxText,
      })

      innerY -= 11

      const shortDomain = cleanText(targetUrl.replace(/^https?:\/\//, ''))
      page.drawText(`-> ${shortDomain}`, {
        x: innerX,
        y: innerY,
        size: 7.2,
        font: fontBold,
        color: cOrange,
      })

      innerY -= 12

      page.drawText('Kalender abonnieren (iCal / Google):', {
        x: innerX,
        y: innerY,
        size: 5.5,
        font: fontBody,
        color: cTextMuted,
      })

      innerY -= 9

      page.drawText(cleanText((options.calendarUrl || `${QR_BASE_URL}/api/calendar.ics`).replace(/^https?:\/\//, '')), {
        x: innerX,
        y: innerY,
        size: 5.5,
        font: fontBold,
        color: cBoxText,
      })

      // Right QR Code inside white border container
      const qrSize = 52
      const qrX = W - marginX - qrSize - 8
      const qrY = boxY + (boxH - qrSize) / 2

      page.drawRectangle({
        x: qrX - 2,
        y: qrY - 2,
        width: qrSize + 4,
        height: qrSize + 4,
        color: cWhite,
        borderColor: isDark ? cOrange : cForest,
        borderWidth: 0.8,
      })

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      })

      page.drawText('HIER SCANNEN ^', {
        x: qrX + 4,
        y: qrY - 8,
        size: 4.8,
        font: fontBold,
        color: isDark ? cOrange : cForest,
      })
    }

    // 5. Page Footer
    page.drawText(
      `SMJ Regio Wegweiser - Jugend leitet Jugend - Stand: ${new Date().getFullYear()}`,
      {
        x: marginX,
        y: footerY,
        size: 5,
        font: fontBody,
        color: cTextMuted,
      },
    )

    const pageNotice = `SEITE ${pageIdx + 1} / ${totalPages}`
    page.drawText(pageNotice, {
      x: W - marginX - fontBold.widthOfTextAtSize(pageNotice, 5),
      y: footerY,
      size: 5,
      font: fontBold,
      color: cTextPrimary,
    })
  }

  return await doc.save()
}

function formatShortDate(start: Date, end: Date): string {
  const sDay = String(start.getDate()).padStart(2, '0')
  const sMonth = String(start.getMonth() + 1).padStart(2, '0')
  const eDay = String(end.getDate()).padStart(2, '0')
  const eMonth = String(end.getMonth() + 1).padStart(2, '0')
  const eYear = end.getFullYear()

  if (start.toDateString() === end.toDateString()) {
    return `${sDay}.${sMonth}.${eYear}`
  }
  if (sMonth === eMonth && start.getFullYear() === eYear) {
    return `${sDay}. - ${eDay}.${eMonth}.${eYear}`
  }
  return `${sDay}.${sMonth}. - ${eDay}.${eMonth}.${eYear}`
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
      dateStr: formatShortDate(start, end),
      location: c.data.location?.name || 'Wiesental bei Thalwenden',
      ageGroup: `${c.data.age?.min || 9}–${c.data.age?.max || 14} Jahre`,
      category: 'camp',
    })
  }

  // Events
  for (const e of events) {
    const start = new Date(e.start)
    const end = new Date(e.end)
    allItems.push({
      start,
      end,
      title: e.title,
      dateStr: formatShortDate(start, end),
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
      targetUrl: `${QR_BASE_URL}/abenteuer/`,
    },
    'terminkarte-2026': {
      id: 'terminkarte-2026',
      filename: 'terminkarte-2026.pdf',
      periodTitle: 'Jahreskalender 2026',
      periodSubtitle: 'Alle Aktionen und Zeltlager im Jahr 2026',
      events: events2026,
      targetUrl: `${QR_BASE_URL}/abenteuer/`,
    },
    'terminkarte-2027': {
      id: 'terminkarte-2027',
      filename: 'terminkarte-2027.pdf',
      periodTitle: 'Jahreskalender 2027',
      periodSubtitle: 'Vorschau auf die Aktionen und Zeltlager 2027',
      events: events2027,
      targetUrl: `${QR_BASE_URL}/abenteuer/`,
    },
    'terminkarte-h1-2026': {
      id: 'terminkarte-h1-2026',
      filename: 'terminkarte-h1-2026.pdf',
      periodTitle: '1. Halbjahr 2026',
      periodSubtitle: 'Aktionen von Januar bis Juni 2026',
      events: eventsH12026,
      targetUrl: `${QR_BASE_URL}/abenteuer/`,
    },
    'terminkarte-h2-2026': {
      id: 'terminkarte-h2-2026',
      filename: 'terminkarte-h2-2026.pdf',
      periodTitle: '2. Halbjahr 2026',
      periodSubtitle: 'Sommerzeltlager & Aktionen Juli bis Dezember 2026',
      events: eventsH22026,
      targetUrl: `${QR_BASE_URL}/abenteuer/`,
    },
  }
}
