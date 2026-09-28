import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'node:fs'

export interface FlyerPdfData {
  title: string
  subtitle?: string
  categoryLabel?: string
  dateStr: string
  locationStr: string
  ageStr: string
  priceStr: string
  highlights: { title: string; desc: string }[]
  targetUrl: string
  shortUrl?: string
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
    .replace(/[✂✄]/g, '-')
    .replace(/[★☆]/g, '*')
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

  // Generate QR Code PNG
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

  // --- HEADER SECTION (y ~ 795 down to 740) ---
  const headerTopY = H - 36
  const logoSize = 46

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
    y: headerTopY - 18,
    size: 9.5,
    font: fontBold,
    color: cOrange,
  })

  page.drawText('Thueringen & Sachsen-Anhalt - smj-wegweiser.de', {
    x: headerTextX,
    y: headerTopY - 32,
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
  const catBadgeY = headerTopY - 26

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
  const headerDividerY = headerTopY - logoSize - 16
  page.drawLine({
    start: { x: marginX, y: headerDividerY },
    end: { x: W - marginX, y: headerDividerY },
    thickness: 2.5,
    color: cForest,
  })

  // --- TITLE & MOTTO SECTION ---
  let currY = headerDividerY - 22

  page.drawText('//  RAUS. INS ABENTEUER.', {
    x: marginX,
    y: currY,
    size: 9.5,
    font: fontBold,
    color: cOrange,
  })

  currY -= 28

  // Main Event Title (Handle long titles with font size adjustment)
  const titleText = cleanText(data.title.toUpperCase())
  const titleFontSize = titleText.length > 28 ? 20 : 25
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
      size: 13,
      font: fontBoldOblique,
      color: cOrange,
    })
    currY -= 22
  } else {
    currY -= 10
  }

  // --- 4 KEY FACTS CARDS ---
  currY -= 6
  const factGap = 8
  const cardW = (contentW - 3 * factGap) / 4
  const cardH = 46

  const facts = [
    { label: 'WANN', value: cleanText(data.dateStr) },
    { label: 'WO', value: cleanText(data.locationStr) },
    { label: 'WER', value: cleanText(data.ageStr) },
    { label: 'BEITRAG', value: cleanText(data.priceStr) },
  ]

  facts.forEach((fact, i) => {
    const cardX = marginX + i * (cardW + factGap)

    // Card background
    page.drawRectangle({
      x: cardX,
      y: currY - cardH,
      width: cardW,
      height: cardH,
      color: cForest,
    })

    // Label
    page.drawText(fact.label, {
      x: cardX + 7,
      y: currY - 14,
      size: 7.5,
      font: fontBold,
      color: cOrange,
    })

    // Value
    let val = fact.value
    let valSize = 8
    if (val.length > 21) {
      valSize = 7
    }
    if (val.length > 28) {
      val = val.substring(0, 27) + '...'
      valSize = 6.5
    }
    page.drawText(val, {
      x: cardX + 7,
      y: currY - 32,
      size: valSize,
      font: fontBold,
      color: cPaper,
    })
  })

  currY -= cardH + 20

  // --- HIGHLIGHTS SECTION ---
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

  currY -= 16

  const rawHighlights = data.highlights && data.highlights.length > 0 ? data.highlights.slice(0, 3) : [
    { title: 'Gemeinschaft & Lagerfeuer', desc: 'Zelte bauen, Nachtwache halten, neue Freunde finden.' },
    { title: 'Großes Geländespiel & Action', desc: 'Spannende Wettkämpfe, Abenteuer im Wald und Workshops.' },
    { title: 'Erfahrene Betreuung', desc: 'Jugend leitet Jugend mit Vollverpflegung und erfahrenen Leitern.' },
  ]

  for (const h of rawHighlights) {
    // Orange left bar
    page.drawRectangle({
      x: marginX,
      y: currY - 18,
      width: 3.5,
      height: 24,
      color: cOrange,
    })

    // Title
    page.drawText(cleanText(h.title.toUpperCase()), {
      x: marginX + 10,
      y: currY - 4,
      size: 10,
      font: fontBold,
      color: cForest,
    })

    // Desc
    page.drawText(cleanText(h.desc), {
      x: marginX + 10,
      y: currY - 17,
      size: 8,
      font: fontRegular,
      color: cForest,
    })

    currY -= 32
  }

  // --- REGISTRATION & QR BOX ---
  currY -= 6
  const regBoxH = 118
  const regBoxY = currY - regBoxH

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

  // Left Content
  const regTextX = marginX + 16
  const regTextY = currY - 16

  // Badge
  page.drawRectangle({
    x: regTextX,
    y: regTextY - 14,
    width: 175,
    height: 16,
    color: cOrange,
  })
  page.drawText('JETZT ANMELDEN & PLAETZE SICHERN', {
    x: regTextX + 6,
    y: regTextY - 9,
    size: 7,
    font: fontBold,
    color: cForest,
  })

  page.drawText('Alle Infos online - Scan den Code!', {
    x: regTextX,
    y: regTextY - 36,
    size: 14,
    font: fontBold,
    color: cForest,
  })

  page.drawText(
    'Kamera ans Handy halten oder Link im Browser oeffnen.\nDort gibt es die offizielle Anmeldung, Packliste und alle Infos fuer Eltern.',
    {
      x: regTextX,
      y: regTextY - 54,
      size: 8,
      font: fontRegular,
      color: cForest,
      lineHeight: 12,
    },
  )

  const cleanUrl = cleanText(data.shortUrl || data.targetUrl.replace(/^https?:\/\//, ''))
  page.drawText(`->  ${cleanUrl}`, {
    x: regTextX,
    y: regTextY - 86,
    size: 9.5,
    font: fontBold,
    color: cOrange,
  })

  // Right QR Code
  const qrBoxSize = 92
  const qrBoxX = W - marginX - qrBoxSize - 16
  const qrBoxY = regBoxY + (regBoxH - qrBoxSize) / 2 + 5

  page.drawImage(qrImage, {
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxSize,
    height: qrBoxSize,
  })

  page.drawText('HIER SCANNEN ^', {
    x: qrBoxX + 16,
    y: qrBoxY - 10,
    size: 6.5,
    font: fontBold,
    color: cForest,
  })

  // --- TEAR-OFF STRIPS (ABREISSZETTEL) ---
  const tearTopY = regBoxY - 24
  const stripH = 92
  const stripW = contentW / 6
  const tearBottomY = tearTopY - stripH

  // Dashed Cut Line Top
  page.drawLine({
    start: { x: marginX, y: tearTopY },
    end: { x: W - marginX, y: tearTopY },
    thickness: 1,
    color: cForest,
    dashArray: [4, 3],
  })

  page.drawText('- Hier einschneiden zum Abreissen -', {
    x: marginX + 12,
    y: tearTopY + 4,
    size: 6.5,
    font: fontBold,
    color: cMuted,
  })

  // 6 Strips
  for (let i = 0; i < 6; i++) {
    const stripX = marginX + i * stripW

    // Right dashed divider
    if (i < 5) {
      page.drawLine({
        start: { x: stripX + stripW, y: tearTopY },
        end: { x: stripX + stripW, y: tearBottomY },
        thickness: 1,
        color: cForest,
        dashArray: [3, 3],
      })
    }

    const centerX = stripX + stripW / 2

    // 1. SMJ AKTION
    const t1 = 'SMJ AKTION'
    page.drawText(t1, {
      x: centerX - fontBold.widthOfTextAtSize(t1, 6) / 2,
      y: tearTopY - 12,
      size: 6,
      font: fontBold,
      color: cOrange,
    })

    // 2. Event Title (truncated)
    let stripTitle = cleanText(data.title.toUpperCase())
    if (stripTitle.length > 14) stripTitle = stripTitle.substring(0, 13) + '...'
    page.drawText(stripTitle, {
      x: centerX - fontBold.widthOfTextAtSize(stripTitle, 6.5) / 2,
      y: tearTopY - 22,
      size: 6.5,
      font: fontBold,
      color: cForest,
    })

    // 3. Mini QR Code
    const miniQrSize = 34
    page.drawImage(qrImage, {
      x: centerX - miniQrSize / 2,
      y: tearTopY - 26 - miniQrSize,
      width: miniQrSize,
      height: miniQrSize,
    })

    // 4. Date short: e.g. "22.-25. Mai"
    let shortDate = cleanText(data.dateStr).replace(/\s*\d{4}$/, '').trim()
    if (shortDate.length > 15) shortDate = shortDate.substring(0, 14) + '..'
    page.drawText(shortDate, {
      x: centerX - fontBold.widthOfTextAtSize(shortDate, 5.5) / 2,
      y: tearTopY - 68,
      size: 5.5,
      font: fontBold,
      color: cForest,
    })

    // 5. Website domain
    const dom = 'smj-wegweiser.de'
    page.drawText(dom, {
      x: centerX - fontRegular.widthOfTextAtSize(dom, 5) / 2,
      y: tearTopY - 78,
      size: 5,
      font: fontRegular,
      color: cMuted,
    })
  }

  // Bottom dashed boundary
  page.drawLine({
    start: { x: marginX, y: tearBottomY },
    end: { x: W - marginX, y: tearBottomY },
    thickness: 1,
    color: cForest,
    dashArray: [4, 3],
  })

  // --- FOOTER NOTICE ---
  const footerY = 28
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
