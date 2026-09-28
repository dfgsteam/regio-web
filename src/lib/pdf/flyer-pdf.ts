import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'node:fs'
import type { ResolvedFlyerData } from './flyer-content'

export type FlyerPdfData = ResolvedFlyerData

function cleanText(text: string): string {
  return text
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[•·]/g, '-')
    .replace(/[“”„]/g, '"')
    .replace(/[’']/g, "'")
    .replace(/[➔➜➝→]/g, '->')
    .replace(/[↑▲]/g, '^')
    .replace(/[✂✄]/g, '-')
    .replace(/[★☆]/g, '*')
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const paragraphs = text.split(/\r?\n/)
  const lines: string[] = []

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue
    const words = trimmed.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(cleanText(testLine), fontSize)
      if (width <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)
  }

  return lines
}

export async function generateFlyerPdf(data: FlyerPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`SMJ Flyer: ${cleanText(data.title)}`)
  doc.setAuthor('SMJ Regio Wegweiser')
  doc.setCreator('SMJ Regio Wegweiser Leiter-Toolbox')

  // DIN A4: 210mm x 297mm = 595.28 x 841.89 pt
  const W = 595.28
  const H = 841.89
  const page = doc.addPage([W, H])

  // Colors
  const cForest = rgb(17 / 255, 23 / 255, 19 / 255) // #111713
  const cPaper = rgb(241 / 255, 235 / 255, 221 / 255) // #F1EBDD
  const cOrange = rgb(255 / 255, 90 / 255, 31 / 255) // #FF5A1F
  const cSand = rgb(201 / 255, 186 / 255, 153 / 255) // #C9BA99
  const cWhite = rgb(1, 1, 1)
  const cMuted = rgb(100 / 255, 105 / 255, 98 / 255)

  // Standard Vector Fonts
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBoldOblique = await doc.embedFont(StandardFonts.HelveticaBoldOblique)

  // 1. Full Page Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: cPaper,
  })

  // Decorative expedition borders
  page.drawRectangle({
    x: 18,
    y: 18,
    width: W - 36,
    height: H - 36,
    borderColor: cForest,
    borderWidth: 2.5,
  })

  page.drawRectangle({
    x: 22,
    y: 22,
    width: W - 44,
    height: H - 44,
    borderColor: cSand,
    borderWidth: 0.75,
  })

  // Margins
  const marginX = 36
  const contentW = W - 2 * marginX // 523.28 pt

  // Generate High-Res QR Code PNG
  const qrPngBuffer = await QRCode.toBuffer(data.targetUrl, {
    margin: 1,
    width: 600,
    color: {
      dark: '#111713',
      light: '#FFFFFF',
    },
  })
  const qrImage = await doc.embedPng(qrPngBuffer)

  // Load and embed Logo PNG
  let logoImage
  try {
    if (fs.existsSync('public/logo_wegweiser_dark.png')) {
      const logoPngBuffer = fs.readFileSync('public/logo_wegweiser_dark.png')
      logoImage = await doc.embedPng(logoPngBuffer)
    }
  } catch (err) {
    console.warn('Could not load logo PNG, fallback to text logo', err)
  }

  // --- HEADER SECTION ---
  const headerTopY = H - 34
  const logoSize = 42

  if (logoImage) {
    page.drawImage(logoImage, {
      x: marginX,
      y: headerTopY - logoSize,
      width: logoSize,
      height: logoSize,
    })
  }

  const headerTextX = logoImage ? marginX + logoSize + 12 : marginX
  page.drawText('SMJ REGIO WEGWEISER - KATHOLISCHE JUGEND', {
    x: headerTextX,
    y: headerTopY - 16,
    size: 9.5,
    font: fontBold,
    color: cOrange,
  })

  page.drawText('Thueringen & Sachsen-Anhalt - smj-wegweiser.de', {
    x: headerTextX,
    y: headerTopY - 30,
    size: 8,
    font: fontRegular,
    color: cMuted,
  })

  // Category Badge (Top Right)
  const categoryStr = cleanText((data.categoryLabel || 'AKTION').toUpperCase())
  const catTextWidth = fontBold.widthOfTextAtSize(categoryStr, 8.5)
  const catBadgeW = catTextWidth + 16
  const catBadgeH = 22
  const catBadgeX = W - marginX - catBadgeW
  const catBadgeY = headerTopY - 24

  page.drawRectangle({
    x: catBadgeX,
    y: catBadgeY,
    width: catBadgeW,
    height: catBadgeH,
    color: cForest,
  })

  page.drawText(categoryStr, {
    x: catBadgeX + 8,
    y: catBadgeY + 6.5,
    size: 8.5,
    font: fontBold,
    color: cWhite,
  })

  // Header Divider Line
  const headerDividerY = headerTopY - logoSize - 12
  page.drawLine({
    start: { x: marginX, y: headerDividerY },
    end: { x: W - marginX, y: headerDividerY },
    thickness: 2,
    color: cForest,
  })

  // --- TITLE & MOTTO SECTION ---
  let currY = headerDividerY - 20

  page.drawText('//  RAUS. INS ABENTEUER.', {
    x: marginX,
    y: currY,
    size: 9,
    font: fontBold,
    color: cOrange,
  })

  currY -= 26

  // Main Event Title
  const titleText = cleanText(data.title.toUpperCase())
  const titleFontSize = titleText.length > 30 ? 18 : 23
  page.drawText(titleText, {
    x: marginX,
    y: currY,
    size: titleFontSize,
    font: fontBold,
    color: cForest,
  })

  currY -= titleFontSize + 4

  if (data.subtitle) {
    page.drawText(`// ${cleanText(data.subtitle)}`, {
      x: marginX,
      y: currY,
      size: 11,
      font: fontBoldOblique,
      color: cOrange,
    })
    currY -= 20
  } else {
    currY -= 8
  }

  // --- 4 KEY FACTS CARDS ---
  currY -= 4
  const factGap = 8
  const cardW = (contentW - 3 * factGap) / 4
  const cardH = 42

  const facts = [
    { label: 'WANN', value: cleanText(data.dateStr) },
    { label: 'WO', value: cleanText(data.locationStr) },
    { label: 'WER', value: cleanText(data.ageStr) },
    { label: 'BEITRAG', value: cleanText(data.priceStr) },
  ]

  facts.forEach((fact, i) => {
    const cardX = marginX + i * (cardW + factGap)

    page.drawRectangle({
      x: cardX,
      y: currY - cardH,
      width: cardW,
      height: cardH,
      color: cForest,
    })

    page.drawText(fact.label, {
      x: cardX + 7,
      y: currY - 13,
      size: 7,
      font: fontBold,
      color: cOrange,
    })

    let val = fact.value
    let valSize = 7.5
    if (val.length > 21) valSize = 6.8
    if (val.length > 28) {
      val = val.substring(0, 27) + '...'
      valSize = 6.2
    }
    page.drawText(val, {
      x: cardX + 7,
      y: currY - 29,
      size: valSize,
      font: fontBold,
      color: cPaper,
    })
  })

  currY -= cardH + 18

  // --- DAS ERWARTET DICH (DESCRIPTION BLOCK) ---
  page.drawText('DAS ERWARTET DICH BEI DIESER AKTION:', {
    x: marginX,
    y: currY,
    size: 8.5,
    font: fontBold,
    color: cForest,
  })

  currY -= 4
  page.drawLine({
    start: { x: marginX, y: currY },
    end: { x: marginX + 220, y: currY },
    thickness: 1,
    color: cSand,
  })

  currY -= 14

  if (data.description) {
    const descLines = wrapText(data.description, contentW, fontRegular, 8.5)
    // Take up to 4 lines to preserve balance
    const linesToDraw = descLines.slice(0, 4)
    for (const line of linesToDraw) {
      page.drawText(cleanText(line), {
        x: marginX,
        y: currY,
        size: 8.5,
        font: fontRegular,
        color: cForest,
      })
      currY -= 12.5
    }
  }

  currY -= 10

  // --- HIGHLIGHTS SECTION ---
  page.drawText('PROGRAMM-HIGHLIGHTS:', {
    x: marginX,
    y: currY,
    size: 8.5,
    font: fontBold,
    color: cForest,
  })

  currY -= 4
  page.drawLine({
    start: { x: marginX, y: currY },
    end: { x: marginX + 160, y: currY },
    thickness: 1,
    color: cSand,
  })

  currY -= 16

  const rawHighlights = data.highlights && data.highlights.length > 0 ? data.highlights.slice(0, 3) : []

  for (const h of rawHighlights) {
    page.drawRectangle({
      x: marginX,
      y: currY - 18,
      width: 3.5,
      height: 24,
      color: cOrange,
    })

    page.drawText(cleanText(h.title.toUpperCase()), {
      x: marginX + 10,
      y: currY - 4,
      size: 9.5,
      font: fontBold,
      color: cForest,
    })

    page.drawText(cleanText(h.desc), {
      x: marginX + 10,
      y: currY - 17,
      size: 8,
      font: fontRegular,
      color: cForest,
    })

    currY -= 30
  }

  currY -= 6

  // --- WAS DU BRAUCHST (PACKLISTE & INFOS) ---
  if (data.packingList && data.packingList.length > 0) {
    page.drawText('WAS DU BRAUCHST (PACKLISTE & INFOS):', {
      x: marginX,
      y: currY,
      size: 8,
      font: fontBold,
      color: cForest,
    })

    currY -= 4
    page.drawLine({
      start: { x: marginX, y: currY },
      end: { x: marginX + 200, y: currY },
      thickness: 1,
      color: cSand,
    })

    currY -= 14

    // Render items in 2 columns
    const items = data.packingList.slice(0, 6)
    const colW = contentW / 2
    const itemsPerCol = Math.ceil(items.length / 2)

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item) continue
      const col = i < itemsPerCol ? 0 : 1
      const row = i < itemsPerCol ? i : i - itemsPerCol
      const itemX = marginX + col * colW
      const itemY = currY - row * 13

      page.drawText(`- ${cleanText(item)}`, {
        x: itemX,
        y: itemY,
        size: 7.5,
        font: fontRegular,
        color: cForest,
      })
    }

    currY -= itemsPerCol * 13 + 12
  }

  // --- REGISTRATION & CONTACT BOX (Fills bottom area before footer) ---
  const footerY = 28
  const regBoxBottomY = footerY + 16
  const regBoxH = Math.max(150, currY - regBoxBottomY)
  const regBoxY = regBoxBottomY

  // Box background & border
  page.drawRectangle({
    x: marginX,
    y: regBoxY,
    width: contentW,
    height: regBoxH,
    color: cWhite,
    borderColor: cForest,
    borderWidth: 2,
  })

  // Left Content Area
  const regTextX = marginX + 16
  let cardInnerY = regBoxY + regBoxH - 18

  // Badge
  page.drawRectangle({
    x: regTextX,
    y: cardInnerY - 14,
    width: 175,
    height: 16,
    color: cOrange,
  })
  page.drawText('ONLINE-ANMELDUNG & INFOS', {
    x: regTextX + 8,
    y: cardInnerY - 9,
    size: 7,
    font: fontBold,
    color: cForest,
  })

  cardInnerY -= 34

  page.drawText('Jetzt anmelden & Plaetze sichern!', {
    x: regTextX,
    y: cardInnerY,
    size: 13.5,
    font: fontBold,
    color: cForest,
  })

  cardInnerY -= 17

  page.drawText(
    'Kamera ans Handy halten oder Link im Browser oeffnen.\nDort gibt es die offizielle Anmeldung, Packliste und alle Infos fuer Eltern.',
    {
      x: regTextX,
      y: cardInnerY,
      size: 8,
      font: fontRegular,
      color: cForest,
      lineHeight: 12,
    },
  )

  cardInnerY -= 28

  const displayUrl = cleanText(data.shortUrl || data.targetUrl.replace(/^https?:\/\//, ''))
  page.drawText(`->  ${displayUrl}`, {
    x: regTextX,
    y: cardInnerY,
    size: 9.5,
    font: fontBold,
    color: cOrange,
  })

  // Contact Info block (using event.contact directly as-is)
  if (data.contact && (data.contact.name || data.contact.email || data.contact.phone)) {
    cardInnerY -= 16
    page.drawLine({
      start: { x: regTextX, y: cardInnerY },
      end: { x: regTextX + 310, y: cardInnerY },
      thickness: 0.75,
      color: cSand,
    })

    cardInnerY -= 12
    page.drawText('FRAGEN ZUR AKTION? ANSPRECHPARTNER:', {
      x: regTextX,
      y: cardInnerY,
      size: 6.8,
      font: fontBold,
      color: cOrange,
    })

    cardInnerY -= 11
    let contactLine = data.contact.name || 'SMJ Regio Wegweiser'
    if (data.contact.role) {
      contactLine += ` (${data.contact.role})`
    }
    page.drawText(cleanText(contactLine), {
      x: regTextX,
      y: cardInnerY,
      size: 7.8,
      font: fontBold,
      color: cForest,
    })

    const details: string[] = []
    if (data.contact.phone) details.push(`Tel.: ${data.contact.phone}`)
    if (data.contact.email) details.push(`E-Mail: ${data.contact.email}`)
    if (details.length > 0) {
      cardInnerY -= 10
      page.drawText(cleanText(details.join('   -   ')), {
        x: regTextX,
        y: cardInnerY,
        size: 7.2,
        font: fontRegular,
        color: cForest,
      })
    }
  }

  // Right Side: Large Scannable QR Code
  const qrBoxSize = 100
  const qrBoxX = W - marginX - qrBoxSize - 16
  const qrBoxY = regBoxY + (regBoxH - qrBoxSize) / 2 + 5

  page.drawImage(qrImage, {
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxSize,
    height: qrBoxSize,
  })

  page.drawText('HIER SCANNEN ^', {
    x: qrBoxX + 18,
    y: qrBoxY - 11,
    size: 6.5,
    font: fontBold,
    color: cForest,
  })

  // --- FOOTER NOTICE ---
  page.drawText(
    `SMJ Regio Wegweiser - Jugend leitet Jugend - Katholische Schoenstatt-Mannesjugend - Stand: ${new Date().getFullYear()}`,
    {
      x: marginX,
      y: footerY,
      size: 6,
      font: fontRegular,
      color: cMuted,
    },
  )

  const printNotice = 'Druckfertiger A4-Aushang'
  page.drawText(printNotice, {
    x: W - marginX - fontRegular.widthOfTextAtSize(printNotice, 6),
    y: footerY,
    size: 6,
    font: fontRegular,
    color: cMuted,
  })

  return await doc.save()
}
