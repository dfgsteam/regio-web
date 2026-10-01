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
  const marginX = 16
  const contentW = W - 2 * marginX // 265.64 pt

  const isDark = options.theme === 'dark'

  // Colors based on theme
  const cForest = rgb(17 / 255, 23 / 255, 19 / 255) // #111713
  const cPaper = rgb(241 / 255, 235 / 255, 221 / 255) // #F1EBDD
  const cOrange = rgb(255 / 255, 90 / 255, 31 / 255) // #FF5A1F
  const cSand = rgb(201 / 255, 186 / 255, 153 / 255) // #C9BA99
  const cWhite = rgb(1, 1, 1)

  const cBg = isDark ? cForest : cPaper
  const cTextPrimary = isDark ? cPaper : cForest
  const cTextMuted = isDark ? rgb(160 / 255, 170 / 255, 155 / 255) : rgb(70 / 255, 80 / 255, 72 / 255)
  const cCardBg = isDark ? rgb(24 / 255, 32 / 255, 25 / 255) : cWhite
  const cCardBorder = isDark ? rgb(45 / 255, 58 / 255, 47 / 255) : rgb(215 / 255, 205 / 255, 185 / 255)



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

    // Expedition framing with technical hairline and signal orange corner brackets
    page.drawRectangle({
      x: 8,
      y: 8,
      width: W - 16,
      height: H - 16,
      borderColor: isDark ? cOrange : cForest,
      borderWidth: 1.2,
    })

    page.drawRectangle({
      x: 11,
      y: 11,
      width: W - 22,
      height: H - 22,
      borderColor: isDark ? rgb(35 / 255, 45 / 255, 37 / 255) : cSand,
      borderWidth: 0.5,
    })

    // Corner brackets in signal orange (arm length 12pt, width 2.2pt)
    const bracketLen = 12
    const bracketThick = 2.2
    // Top-Left
    page.drawLine({ start: { x: 8, y: H - 8 }, end: { x: 8 + bracketLen, y: H - 8 }, thickness: bracketThick, color: cOrange })
    page.drawLine({ start: { x: 8, y: H - 8 }, end: { x: 8, y: H - 8 - bracketLen }, thickness: bracketThick, color: cOrange })
    // Top-Right
    page.drawLine({ start: { x: W - 8, y: H - 8 }, end: { x: W - 8 - bracketLen, y: H - 8 }, thickness: bracketThick, color: cOrange })
    page.drawLine({ start: { x: W - 8, y: H - 8 }, end: { x: W - 8, y: H - 8 - bracketLen }, thickness: bracketThick, color: cOrange })
    // Bottom-Left
    page.drawLine({ start: { x: 8, y: 8 }, end: { x: 8 + bracketLen, y: 8 }, thickness: bracketThick, color: cOrange })
    page.drawLine({ start: { x: 8, y: 8 }, end: { x: 8, y: 8 + bracketLen }, thickness: bracketThick, color: cOrange })
    // Bottom-Right
    page.drawLine({ start: { x: W - 8, y: 8 }, end: { x: W - 8 - bracketLen, y: 8 }, thickness: bracketThick, color: cOrange })
    page.drawLine({ start: { x: W - 8, y: 8 }, end: { x: W - 8, y: 8 + bracketLen }, thickness: bracketThick, color: cOrange })

    let currY = H - 20

    // 2. Header
    if (isFirstPage) {
      const logoBadgeSize = 30
      const logoBadgeY = currY - logoBadgeSize

      // Logo container patch
      page.drawRectangle({
        x: marginX,
        y: logoBadgeY,
        width: logoBadgeSize,
        height: logoBadgeSize,
        color: isDark ? rgb(24 / 255, 32 / 255, 25 / 255) : cForest,
        borderColor: cOrange,
        borderWidth: 1,
      })

      if (logoImage) {
        const imgSize = 22
        page.drawImage(logoImage, {
          x: marginX + (logoBadgeSize - imgSize) / 2,
          y: logoBadgeY + (logoBadgeSize - imgSize) / 2,
          width: imgSize,
          height: imgSize,
        })
      }

      const headerTextX = marginX + logoBadgeSize + 8

      page.drawText('SCHÖNSTATT-MANNESJUGEND', {
        x: headerTextX,
        y: currY - 9,
        size: 5.8,
        font: fontBold,
        color: cOrange,
      })

      page.drawText('SMJ REGIO WEGWEISER', {
        x: headerTextX,
        y: currY - 19,
        size: 8.5,
        font: fontDisplay,
        color: cTextPrimary,
      })

      page.drawText('DRAUSSEN - GEMEINSCHAFT - ABENTEUER', {
        x: headerTextX,
        y: currY - 27,
        size: 4.8,
        font: fontBody,
        color: cTextMuted,
      })

      // Badge top right
      const badgeStr = 'TERMINKALENDER'
      const badgeW = fontBold.widthOfTextAtSize(badgeStr, 6.2) + 14
      const badgeH = 15
      page.drawRectangle({
        x: W - marginX - badgeW,
        y: currY - 20,
        width: badgeW,
        height: badgeH,
        color: isDark ? cOrange : cForest,
      })
      page.drawText(badgeStr, {
        x: W - marginX - badgeW + 7,
        y: currY - 15,
        size: 6.2,
        font: fontBold,
        color: isDark ? cForest : cWhite,
      })

      currY -= logoBadgeSize + 6

      // Title & Period Headline separator
      page.drawLine({
        start: { x: marginX, y: currY },
        end: { x: W - marginX, y: currY },
        thickness: 0.8,
        color: cCardBorder,
      })

      currY -= 12

      page.drawText('// RAUS. INS ABENTEUER.', {
        x: marginX,
        y: currY,
        size: 7,
        font: fontBold,
        color: cOrange,
      })

      currY -= 14

      const titleStr = cleanText(options.periodTitle.toUpperCase())
      const titleSize = titleStr.length > 25 ? 13 : 15
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
          size: 6.8,
          font: fontBody,
          color: cTextMuted,
        })
        currY -= 12
      } else {
        currY -= 4
      }
    } else {
      // Subsequent page compact header
      page.drawText('SMJ REGIO WEGWEISER // TERMINKALENDER', {
        x: marginX,
        y: currY - 6,
        size: 6.5,
        font: fontBold,
        color: cOrange,
      })

      const fortText = `Fortsetzung (Seite ${pageIdx + 1}/${totalPages})`
      page.drawText(fortText, {
        x: W - marginX - fontMono.widthOfTextAtSize(fortText, 5.8),
        y: currY - 6,
        size: 5.8,
        font: fontMono,
        color: cTextMuted,
      })

      currY -= 11
      page.drawLine({
        start: { x: marginX, y: currY },
        end: { x: W - marginX, y: currY },
        thickness: 0.8,
        color: cCardBorder,
      })
      currY -= 10
    }

    // 3. Dynamic Height & Spacing Calculation for Event Items
    const footerY = 16
    const boxBottomY = footerY + 8
    const boxH = 72
    const bottomReservedY = isLastPage ? boxBottomY + boxH + 10 : boxBottomY + 18

    const availableEventsH = Math.max(80, currY - bottomReservedY)
    const eventCount = Math.max(1, pageEvents.length)

    // Calculate optimal item height based on count
    let cardH = 38
    if (eventCount === 1) cardH = 75
    else if (eventCount === 2) cardH = 64
    else if (eventCount === 3) cardH = 54
    else if (eventCount === 4) cardH = 46
    else if (eventCount === 5) cardH = 40
    else cardH = 37

    const totalCardsH = cardH * eventCount
    const cardGap = Math.max(3, Math.min(10, Math.floor((availableEventsH - totalCardsH) / (eventCount + 1))))

    currY -= cardGap

    for (let i = 0; i < pageEvents.length; i++) {
      const ev = pageEvents[i]
      if (!ev) continue

      const cardY = currY - cardH

      // Card Container
      page.drawRectangle({
        x: marginX,
        y: cardY,
        width: contentW,
        height: cardH,
        color: cCardBg,
        borderColor: cCardBorder,
        borderWidth: 0.8,
      })

      // Left Orange Ticket Stripe
      page.drawRectangle({
        x: marginX,
        y: cardY,
        width: 3.5,
        height: cardH,
        color: cOrange,
      })

      // Category Pill (Top Right)
      let catText = 'AKTION'
      const titleLower = ev.title.toLowerCase()
      if (titleLower.includes('zeltlager') || ev.category === 'camp') catText = 'ZELTLAGER'
      else if (titleLower.includes('wochenende') || ev.category === 'weekend') catText = 'WOCHENENDE'
      else if (titleLower.includes('familie')) catText = 'FAMILIE'
      else if (ev.category === 'special') catText = 'SPECIAL'

      const catBadgeW = fontBold.widthOfTextAtSize(catText, 4.8) + 8
      const catBadgeH = 10
      const catBadgeX = marginX + contentW - catBadgeW - 6
      const catBadgeY = cardY + cardH - catBadgeH - 4

      page.drawRectangle({
        x: catBadgeX,
        y: catBadgeY,
        width: catBadgeW,
        height: catBadgeH,
        color: isDark ? rgb(35 / 255, 45 / 255, 37 / 255) : rgb(240 / 255, 235 / 255, 225 / 255),
      })
      page.drawText(catText, {
        x: catBadgeX + 4,
        y: catBadgeY + 2.5,
        size: 4.8,
        font: fontBold,
        color: isDark ? cOrange : cForest,
      })

      // Date chip
      const dateSize = cardH >= 55 ? 7.2 : 6.4
      const dateY = cardY + cardH - (cardH >= 55 ? 13 : 11)
      page.drawText(cleanText(ev.dateStr.toUpperCase()), {
        x: marginX + 10,
        y: dateY,
        size: dateSize,
        font: fontBold,
        color: cOrange,
      })

      // Title with automatic word wrapping
      const fullTitle = cleanText(ev.title.toUpperCase())
      const maxTextW = contentW - 20
      const titleSize = cardH >= 60 ? 12 : (cardH >= 50 ? 10.5 : 9)
      const titleY = dateY - titleSize - 2
      const textWidth = fontDisplay.widthOfTextAtSize(fullTitle, titleSize)

      if (textWidth <= maxTextW) {
        page.drawText(fullTitle, {
          x: marginX + 10,
          y: titleY,
          size: titleSize,
          font: fontDisplay,
          color: cTextPrimary,
        })
      } else {
        const words = fullTitle.split(' ')
        let line1 = ''
        let line2 = ''
        for (const w of words) {
          const testLine = line1 ? `${line1} ${w}` : w
          if (fontDisplay.widthOfTextAtSize(testLine, titleSize) <= maxTextW) {
            line1 = testLine
          } else {
            line2 = line2 ? `${line2} ${w}` : w
          }
        }
        if (!line2) {
          line1 = fullTitle
        }

        if (cardH <= 42) {
          const shrinkSize = 7.8
          page.drawText(line1, {
            x: marginX + 10,
            y: dateY - shrinkSize - 1.5,
            size: shrinkSize,
            font: fontDisplay,
            color: cTextPrimary,
          })
          if (line2) {
            page.drawText(line2, {
              x: marginX + 10,
              y: dateY - shrinkSize * 2 - 2.5,
              size: shrinkSize,
              font: fontDisplay,
              color: cTextPrimary,
            })
          }
        } else {
          page.drawText(line1, {
            x: marginX + 10,
            y: titleY,
            size: titleSize,
            font: fontDisplay,
            color: cTextPrimary,
          })
          if (line2) {
            page.drawText(line2, {
              x: marginX + 10,
              y: titleY - titleSize - 1,
              size: titleSize,
              font: fontDisplay,
              color: cTextPrimary,
            })
          }
        }
      }

      // Meta: Location & Age
      const locAgeParts: string[] = []
      if (ev.location) locAgeParts.push(ev.location)
      if (ev.ageGroup) locAgeParts.push(ev.ageGroup)
      const metaStr = cleanText(locAgeParts.join('  -  '))

      if (metaStr && cardH >= 42) {
        const metaSize = cardH >= 60 ? 6.5 : (cardH >= 50 ? 5.8 : 5.2)
        const metaY = cardY + 5.5
        page.drawText(metaStr, {
          x: marginX + 10,
          y: metaY,
          size: metaSize,
          font: fontBody,
          color: cTextMuted,
        })
      }

      currY = cardY - cardGap
    }

    // Callout box if 1-2 events to maintain editorial weight
    if (isLastPage && pageEvents.length <= 2) {
      const calloutH = 34
      const calloutY = boxBottomY + boxH + 12
      page.drawRectangle({
        x: marginX,
        y: calloutY,
        width: contentW,
        height: calloutH,
        color: isDark ? rgb(24 / 255, 32 / 255, 25 / 255) : rgb(246 / 255, 242 / 255, 234 / 255),
        borderColor: cCardBorder,
        borderWidth: 0.8,
      })
      page.drawText('// JUGEND LEITET JUGEND - 100% DRAUSSEN', {
        x: marginX + 10,
        y: calloutY + calloutH - 12,
        size: 5.5,
        font: fontBold,
        color: cOrange,
      })
      page.drawText('Zeltlager, Aktionen und echte Gemeinschaft unter Jungs.', {
        x: marginX + 10,
        y: calloutY + 8,
        size: 5.5,
        font: fontBody,
        color: cTextMuted,
      })
    }

    // Notice on multi-page when Page 1 ends
    if (!isLastPage && totalPages > 1) {
      const fortText = 'FORTSETZUNG AUF SEITE ' + (pageIdx + 2) + ' ->'
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
        y: boxBottomY + 5.5,
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
        color: isDark ? rgb(24 / 255, 32 / 255, 25 / 255) : cForest,
        borderColor: cOrange,
        borderWidth: 1.5,
      })

      const innerX = marginX + 10
      let innerY = boxY + boxH - 11

      // Orange badge
      page.drawRectangle({
        x: innerX,
        y: innerY - 8,
        width: 104,
        height: 11,
        color: cOrange,
      })
      page.drawText('INFOS & ANMELDUNG', {
        x: innerX + 6,
        y: innerY - 5,
        size: 5.5,
        font: fontBold,
        color: cForest,
      })

      innerY -= 17

      page.drawText('Alle Termine & Anmeldung online:', {
        x: innerX,
        y: innerY,
        size: 6,
        font: fontBody,
        color: rgb(241 / 255, 235 / 255, 221 / 255),
      })

      innerY -= 11

      const displayDomain = targetUrl.includes('127.0.0.1') || targetUrl.includes('localhost')
        ? 'smj-wegweiser.de/abenteuer'
        : cleanText(targetUrl.replace(/^https?:\/\//, ''))

      page.drawText(`-> ${displayDomain}`, {
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
        size: 5.2,
        font: fontBody,
        color: rgb(201 / 255, 186 / 255, 153 / 255),
      })

      innerY -= 8

      const calendarDisplay = (options.calendarUrl || `${QR_BASE_URL}/api/calendar.ics`)
        .replace(/^https?:\/\//, '')
        .replace(/127\.0\.0\.1:\d+/, 'smj-wegweiser.de')
        .replace(/localhost:\d+/, 'smj-wegweiser.de')

      page.drawText(cleanText(calendarDisplay), {
        x: innerX,
        y: innerY,
        size: 5.2,
        font: fontBold,
        color: rgb(241 / 255, 235 / 255, 221 / 255),
      })

      // Right QR Code inside white border container
      const qrSize = 50
      const qrX = W - marginX - qrSize - 8
      const qrY = boxY + (boxH - qrSize) / 2 + 3

      page.drawRectangle({
        x: qrX - 2,
        y: qrY - 2,
        width: qrSize + 4,
        height: qrSize + 4,
        color: cWhite,
        borderColor: cOrange,
        borderWidth: 0.8,
      })

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      })

      page.drawText('QR-CODE SCANNEN', {
        x: qrX + 2,
        y: qrY - 7.5,
        size: 4.6,
        font: fontBold,
        color: cOrange,
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
      periodSubtitle: 'Die nächsten Monate im Überblick',
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
