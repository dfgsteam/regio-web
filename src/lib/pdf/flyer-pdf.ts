import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
  doc.registerFontkit(fontkit)

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

  // 1. Embed Brand Fonts (Anton for Display, Caveat for Handwriting, Space Mono for Utility, Inter for Body)
  let fontDisplay: PDFFont
  let fontHand: PDFFont
  let fontMono: PDFFont
  let fontBody: PDFFont

  try {
    fontDisplay = await doc.embedFont(loadFontBuffer('Anton-Regular.ttf'))
  } catch (err) {
    console.error('[flyer-pdf] Failed to load Anton-Regular.ttf:', err)
    fontDisplay = await doc.embedFont(StandardFonts.HelveticaBold)
  }

  try {
    fontHand = await doc.embedFont(loadFontBuffer('Caveat-Bold.ttf'))
  } catch (err) {
    console.error('[flyer-pdf] Failed to load Caveat-Bold.ttf:', err)
    fontHand = await doc.embedFont(StandardFonts.HelveticaBoldOblique)
  }

  try {
    fontMono = await doc.embedFont(loadFontBuffer('SpaceMono-Bold.ttf'))
  } catch (err) {
    console.error('[flyer-pdf] Failed to load SpaceMono-Bold.ttf:', err)
    fontMono = await doc.embedFont(StandardFonts.CourierBold)
  }

  try {
    fontBody = await doc.embedFont(loadFontBuffer('Inter-Regular.ttf'))
  } catch (err) {
    console.error('[flyer-pdf] Failed to load Inter-Regular.ttf:', err)
    fontBody = await doc.embedFont(StandardFonts.Helvetica)
  }

  // Background
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
  } catch {
    // fallback without logo
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
    font: fontMono,
    color: cOrange,
  })

  page.drawText('Thueringen & Sachsen-Anhalt - smj-wegweiser.de', {
    x: headerTextX,
    y: headerTopY - 30,
    size: 8,
    font: fontBody,
    color: cMuted,
  })

  // Category Badge (Top Right)
  const categoryStr = cleanText((data.categoryLabel || 'AKTION').toUpperCase())
  const catTextWidth = fontMono.widthOfTextAtSize(categoryStr, 8)
  const catBadgeW = catTextWidth + 18
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
    x: catBadgeX + 9,
    y: catBadgeY + 6.5,
    size: 8,
    font: fontMono,
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
  let currY = headerDividerY - 22

  page.drawText('//  RAUS. INS ABENTEUER.', {
    x: marginX,
    y: currY,
    size: 9.5,
    font: fontMono,
    color: cOrange,
  })

  currY -= 36

  // Main Event Title (Anton display font)
  const titleText = cleanText(data.title.toUpperCase())
  const titleFontSize = titleText.length > 26 ? 30 : 36
  page.drawText(titleText, {
    x: marginX,
    y: currY,
    size: titleFontSize,
    font: fontDisplay,
    color: cForest,
  })

  currY -= 16

  // Motto / Subtitle (Caveat handwriting font with clean word wrapping)
  if (data.subtitle) {
    const mottoLines = wrapText(`// ${cleanText(data.subtitle)}`, contentW, fontHand, 17)
    for (const mLine of mottoLines) {
      page.drawText(cleanText(mLine), {
        x: marginX,
        y: currY,
        size: 17,
        font: fontHand,
        color: cOrange,
      })
      currY -= 20
    }
    currY -= 6
  } else {
    currY -= 10
  }

  // --- 4 KEY FACTS CARDS (High contrast adventure badges) ---
  currY -= 4
  const factGap = 8
  const cardW = (contentW - 3 * factGap) / 4
  const cardH = 54

  const facts = [
    { label: 'WANN', value: cleanText(data.dateStr) },
    { label: 'WO', value: cleanText(data.locationStr) },
    { label: 'WER', value: cleanText(data.ageStr) },
    { label: 'BEITRAG', value: cleanText(data.priceStr) },
  ]

  facts.forEach((fact, i) => {
    const cardX = marginX + i * (cardW + factGap)

    // Dark solid card
    page.drawRectangle({
      x: cardX,
      y: currY - cardH,
      width: cardW,
      height: cardH,
      color: cForest,
    })

    // Orange label
    page.drawText(fact.label, {
      x: cardX + 8,
      y: currY - 15,
      size: 7.5,
      font: fontMono,
      color: cOrange,
    })

    // Value text
    let val = fact.value
    let valSize = 9
    if (val.length > 18) valSize = 8
    if (val.length > 26) {
      val = val.substring(0, 25) + '...'
      valSize = 7.2
    }
    page.drawText(val, {
      x: cardX + 8,
      y: currY - 36,
      size: valSize,
      font: fontMono,
      color: cPaper,
    })
  })

  currY -= cardH + 26

  // --- ADVENTURE HOOK / POSTER CLAIM (Blickfang statt Textwüste) ---
  page.drawText('DRECK AN DEN SCHUHEN. RAUCH IN DEN KLAMOTTEN. GESCHICHTEN IM KOPF.', {
    x: marginX,
    y: currY,
    size: 13,
    font: fontDisplay,
    color: cOrange,
  })

  currY -= 18

  // Punchy teaser sentence (short, impactful, readable from distance)
  let teaserText = cleanText(data.description || '')
  // If description is long, take first 1-2 sentences
  const sentenceMatch = teaserText.match(/^.*?[.!?](?:\s+.*?[.!?])?/)
  if (sentenceMatch && sentenceMatch[0] && sentenceMatch[0].length > 30) {
    teaserText = sentenceMatch[0]
  }
  if (!teaserText || teaserText.length < 25) {
    teaserText = 'Gemeinschaft erleben, Neues wagen und draussen sein! Freu dich auf ein echtes Abenteuer mit Freunden, Lagerfeuer und erfahrenen Gruppenleitern.'
  }

  const teaserLines = wrapText(teaserText, contentW, fontBody, 10.5).slice(0, 3)
  for (const tLine of teaserLines) {
    page.drawText(cleanText(tLine), {
      x: marginX,
      y: currY,
      size: 10.5,
      font: fontBody,
      color: cForest,
    })
    currY -= 15
  }

  currY -= 12

  // --- HIGHLIGHTS SECTION (Grosse, plakative Aktionspunkte) ---
  page.drawText('DAS ERWARTET DICH BEI DIESER AKTION:', {
    x: marginX,
    y: currY,
    size: 9.5,
    font: fontMono,
    color: cForest,
  })

  currY -= 6
  page.drawLine({
    start: { x: marginX, y: currY },
    end: { x: marginX + 240, y: currY },
    thickness: 1,
    color: cSand,
  })

  currY -= 18

  const rawHighlights = data.highlights && data.highlights.length > 0
    ? data.highlights.slice(0, 3)
    : [
        { title: 'GELAENDESPIELE & ACTION IM WALD', desc: 'Strategie, Teamgeist und echtes Abenteuer draussen in der Natur.' },
        { title: 'LAGERFEUER & ABENDPROGRAMM', desc: 'Gemeinsame Abende am Feuer, Gelaendespiele bei Nacht und starke Gemeinschaft.' },
        { title: 'ECHTE FREUNDSCHAFT & LEBENSFREUDE', desc: 'Zusammenhalt erleben nach dem Prinzip: Jugend leitet Jugend.' },
      ]

  for (const h of rawHighlights) {
    page.drawRectangle({
      x: marginX,
      y: currY - 20,
      width: 4,
      height: 26,
      color: cOrange,
    })

    page.drawText(cleanText(h.title.toUpperCase()), {
      x: marginX + 12,
      y: currY - 4,
      size: 13,
      font: fontDisplay,
      color: cForest,
    })

    page.drawText(cleanText(h.desc), {
      x: marginX + 12,
      y: currY - 18,
      size: 9.5,
      font: fontBody,
      color: cForest,
    })

    currY -= 36
  }

  // --- REGISTRATION & CALL-TO-ACTION HERO BOX ---
  // High-impact advertising banner box right above the footer
  const footerY = 24
  const regBoxH = 200
  const regBoxY = footerY + 16

  // Box background & double border
  page.drawRectangle({
    x: marginX,
    y: regBoxY,
    width: contentW,
    height: regBoxH,
    color: cWhite,
    borderColor: cForest,
    borderWidth: 2.5,
  })

  // Inner subtle accent frame
  page.drawRectangle({
    x: marginX + 4,
    y: regBoxY + 4,
    width: contentW - 8,
    height: regBoxH - 8,
    borderColor: cSand,
    borderWidth: 0.75,
  })

  // Left Content Area
  const regTextX = marginX + 18
  let cardInnerY = regBoxY + regBoxH - 22

  // Orange Badge
  page.drawRectangle({
    x: regTextX,
    y: cardInnerY - 14,
    width: 175,
    height: 18,
    color: cOrange,
  })
  page.drawText('ONLINE-ANMELDUNG & INFOS', {
    x: regTextX + 10,
    y: cardInnerY - 9.5,
    size: 7.5,
    font: fontMono,
    color: cForest,
  })

  cardInnerY -= 36

  // Catchy Call-To-Action Title
  page.drawText('BIST DU BEREIT? JETZT DABEI SEIN!', {
    x: regTextX,
    y: cardInnerY,
    size: 18,
    font: fontDisplay,
    color: cForest,
  })

  cardInnerY -= 17

  page.drawText(
    'Kamera ans Handy halten oder Link im Browser oeffnen:',
    {
      x: regTextX,
      y: cardInnerY,
      size: 9,
      font: fontBody,
      color: cForest,
    },
  )

  cardInnerY -= 18

  const displayUrl = cleanText(data.shortUrl || data.targetUrl.replace(/^https?:\/\//, ''))
  page.drawText(`->  ${displayUrl}`, {
    x: regTextX,
    y: cardInnerY,
    size: 10.5,
    font: fontMono,
    color: cOrange,
  })

  cardInnerY -= 20

  // 3 Clear Value Checkmarks
  const checkmarks = [
    '+ Alle Details, Ablaufzeiten & Packliste online',
    '+ Einfache Online-Anmeldung fuer dich & deine Eltern',
    '+ Verlaessliche Betreuung: Jugend leitet Jugend',
  ]

  for (const cm of checkmarks) {
    page.drawText(cm, {
      x: regTextX,
      y: cardInnerY,
      size: 8.5,
      font: fontBody,
      color: cForest,
    })
    cardInnerY -= 13
  }

  // Contact Info block at bottom of box
  if (data.contact && (data.contact.name || data.contact.email || data.contact.phone)) {
    cardInnerY -= 4
    page.drawLine({
      start: { x: regTextX, y: cardInnerY },
      end: { x: regTextX + 320, y: cardInnerY },
      thickness: 0.5,
      color: cSand,
    })

    cardInnerY -= 11
    let contactLine = `Fragen? Ansprechpartner: ${data.contact.name || 'SMJ Regio Wegweiser'}`
    if (data.contact.role) {
      contactLine += ` (${data.contact.role})`
    }
    const details: string[] = []
    if (data.contact.phone) details.push(`Tel.: ${data.contact.phone}`)
    if (data.contact.email) details.push(data.contact.email)
    if (details.length > 0) {
      contactLine += `  -  ${details.join('  -  ')}`
    }

    page.drawText(cleanText(contactLine), {
      x: regTextX,
      y: cardInnerY,
      size: 7.2,
      font: fontBody,
      color: cForest,
    })
  }

  // Right Side: Giant, High-Contrast QR Code
  const qrBoxSize = 110
  const qrBoxX = W - marginX - qrBoxSize - 20
  const qrBoxY = regBoxY + (regBoxH - qrBoxSize) / 2 + 10

  // White backing with border for maximum scan reliability
  page.drawRectangle({
    x: qrBoxX - 4,
    y: qrBoxY - 4,
    width: qrBoxSize + 8,
    height: qrBoxSize + 8,
    color: cWhite,
    borderColor: cForest,
    borderWidth: 1.5,
  })

  page.drawImage(qrImage, {
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxSize,
    height: qrBoxSize,
  })

  page.drawText('HIER SCANNEN ^', {
    x: qrBoxX + 16,
    y: qrBoxY - 14,
    size: 7.5,
    font: fontMono,
    color: cForest,
  })

  page.drawText('DIREKT ZUR ANMELDUNG', {
    x: qrBoxX + 8,
    y: qrBoxY - 24,
    size: 6.5,
    font: fontMono,
    color: cOrange,
  })

  // --- FOOTER NOTICE ---
  page.drawText(
    `SMJ Regio Wegweiser - Jugend leitet Jugend - Katholische Schoenstatt-Mannesjugend - Stand: ${new Date().getFullYear()}`,
    {
      x: marginX,
      y: footerY,
      size: 6,
      font: fontMono,
      color: cMuted,
    },
  )

  const printNotice = 'Werbeplakat & Aushang'
  page.drawText(printNotice, {
    x: W - marginX - fontMono.widthOfTextAtSize(printNotice, 6),
    y: footerY,
    size: 6,
    font: fontMono,
    color: cMuted,
  })

  return await doc.save()
}
