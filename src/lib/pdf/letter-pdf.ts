import { PDFDocument, rgb, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CiviRecipient, CampaignEventData } from '../civicrm/types'
import { splitFact } from '../campaigns/split-fact'

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
    if (!trimmed) {
      lines.push('')
      continue
    }
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

let cachedLogoBuffer: Buffer | null = null

async function getLetterLogoBuffer(): Promise<Buffer | null> {
  if (cachedLogoBuffer) return cachedLogoBuffer
  try {
    const { default: sharp } = await import('sharp')
    const svgPath = path.resolve(process.cwd(), 'public/logo_wegweiser_dark.svg')
    if (fs.existsSync(svgPath)) {
      cachedLogoBuffer = await sharp(svgPath, { density: 300 }).png().toBuffer()
      return cachedLogoBuffer
    }
  } catch (e) {
    console.warn('[letter-pdf] Failed to render logo vector to PNG:', e)
  }
  return null
}

/**
 * Draws a single DIN A4 personalized letter for a recipient.
 */
export async function appendLetterPage(
  pdfDoc: PDFDocument,
  recipient: CiviRecipient,
  event: CampaignEventData,
  fonts: {
    fontAnton: PDFFont
    fontInter: PDFFont
    fontMono: PDFFont
  },
): Promise<void> {
  // DIN A4 standard dimensions in points (72 pt/inch)
  const pageWidth = 595.28
  const pageHeight = 841.89

  const page = pdfDoc.addPage([pageWidth, pageHeight])

  // Palette
  const colorForest = rgb(17 / 255, 23 / 255, 19 / 255)
  const colorOrange = rgb(255 / 255, 90 / 255, 31 / 255)
  const colorMuted = rgb(110 / 255, 120 / 255, 112 / 255)
  const colorBoxBg = rgb(246 / 255, 243 / 255, 236 / 255)
  const colorBorder = rgb(215 / 255, 206 / 255, 188 / 255)

  // Subtle Logo Watermark in background
  const logoBuf = await getLetterLogoBuffer()
  if (logoBuf) {
    try {
      const watermarkImg = await pdfDoc.embedPng(logoBuf)
      page.drawImage(watermarkImg, {
        x: pageWidth / 2 - 120,
        y: pageHeight / 2 - 105,
        width: 240,
        height: 210,
        opacity: 0.08,
      })
    } catch (e) {
      console.warn('[letter-pdf] Failed to embed watermark:', e)
    }
  }

  // 1. DIN 5008 Fold Marks (Falzmarken & Lochmarke)
  // Falzmarke 1: 105mm (297.64 pt from top)
  page.drawLine({
    start: { x: 10, y: pageHeight - 297.64 },
    end: { x: 18, y: pageHeight - 297.64 },
    thickness: 0.5,
    color: colorMuted,
  })
  // Lochmarke: 148.5mm (420.94 pt from top)
  page.drawLine({
    start: { x: 8, y: pageHeight - 420.94 },
    end: { x: 20, y: pageHeight - 420.94 },
    thickness: 0.75,
    color: colorMuted,
  })
  // Falzmarke 2: 210mm (595.28 pt from top)
  page.drawLine({
    start: { x: 10, y: pageHeight - 595.28 },
    end: { x: 18, y: pageHeight - 595.28 },
    thickness: 0.5,
    color: colorMuted,
  })

  // 2. Header Branding (Top Right / Top Margin)
  const headerRight = pageWidth - 56.7 // 20mm right margin
  const brandTitleWidth = fonts.fontAnton.widthOfTextAtSize('SMJ REGIO WEGWEISER', 20)
  
  if (logoBuf) {
    try {
      const headerLogoImg = await pdfDoc.embedPng(logoBuf)
      const logoW = 38
      const logoH = 33.3
      page.drawImage(headerLogoImg, {
        x: headerRight - brandTitleWidth - logoW - 10,
        y: pageHeight - 60,
        width: logoW,
        height: logoH,
      })
    } catch (e) {
      console.warn('[letter-pdf] Failed to embed header logo:', e)
    }
  }

  page.drawText('SMJ REGIO WEGWEISER', {
    x: headerRight - brandTitleWidth,
    y: pageHeight - 48,
    size: 20,
    font: fonts.fontAnton,
    color: colorOrange,
  })
  const subBrand = 'SCHÖNSTATT-MANNESJUGEND'
  page.drawText(subBrand, {
    x: headerRight - fonts.fontMono.widthOfTextAtSize(subBrand, 7.5),
    y: pageHeight - 60,
    size: 7.5,
    font: fonts.fontMono,
    color: colorForest,
  })

  // 3. Sender Line (DIN 5008 Rücksendeangabe für Fensterbriefumschlag)
  // 45mm from top = 127.56 pt
  const leftMargin = 56.7 // 20mm from left
  const senderLineY = pageHeight - 128
  const senderLineText = 'Regio Wegweiser • Pater-Kentenich-Weg 3 • 37308 Heiligenstadt'
  page.drawText(senderLineText, {
    x: leftMargin,
    y: senderLineY,
    size: 7.5,
    font: fonts.fontInter,
    color: colorMuted,
  })
  page.drawLine({
    start: { x: leftMargin, y: senderLineY - 3 },
    end: { x: leftMargin + 240, y: senderLineY - 3 },
    thickness: 0.5,
    color: colorBorder,
  })

  // 4. Recipient Address Field (DIN 5008 Anschriftzone: 45mm x 85mm)
  const addrStartY = senderLineY - 18
  const addr = recipient.address
  const addrLines = [
    recipient.displayName || `${recipient.firstName} ${recipient.lastName}`,
    addr?.street || '',
    addr ? `${addr.postalCode} ${addr.city}` : '',
  ].filter(Boolean)

  if (addrLines.length > 0) {
    addrLines.forEach((l, idx) => {
      page.drawText(cleanText(l), {
        x: leftMargin,
        y: addrStartY - idx * 13,
        size: 10,
        font: fonts.fontInter,
        color: colorForest,
      })
    })
  } else {
    page.drawText(cleanText(recipient.displayName || `${recipient.firstName} ${recipient.lastName}`), {
      x: leftMargin,
      y: addrStartY,
      size: 10,
      font: fonts.fontInter,
      color: colorForest,
    })
  }

  // 5. Info & Date Block (Right side at 220 pt from top)
  const today = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())
  const infoX = headerRight - 165
  const infoY = pageHeight - 138

  page.drawText('SMJ Regio Wegweiser', {
    x: infoX,
    y: infoY,
    size: 9.5,
    font: fonts.fontAnton,
    color: colorForest,
  })
  page.drawText('Klause 2.0', {
    x: infoX,
    y: infoY - 12,
    size: 8,
    font: fonts.fontInter,
    color: colorForest,
  })
  page.drawText('Pater-Kentenich-Weg 3', {
    x: infoX,
    y: infoY - 22,
    size: 8,
    font: fonts.fontInter,
    color: colorForest,
  })
  page.drawText('37308 Heilbad Heiligenstadt', {
    x: infoX,
    y: infoY - 32,
    size: 8,
    font: fonts.fontInter,
    color: colorForest,
  })
  page.drawText('smj-wegweiser.de', {
    x: infoX,
    y: infoY - 42,
    size: 8,
    font: fonts.fontInter,
    color: colorForest,
  })
  page.drawText('Datum: ' + today, {
    x: infoX,
    y: infoY - 60,
    size: 8,
    font: fonts.fontInter,
    color: colorMuted,
  })

  // 6. Subject Line (Betreffzeile) at ~280 pt from top
  const subjectY = pageHeight - 275
  page.drawText('// PERSÖNLICHE EINLADUNG', {
    x: leftMargin,
    y: subjectY + 26,
    size: 11,
    font: fonts.fontAnton,
    color: colorOrange,
  })
  const subject = `DEIN NÄCHSTES ABENTEUER: ${event.title.toUpperCase()}`
  page.drawText(cleanText(subject), {
    x: leftMargin,
    y: subjectY,
    size: 18,
    font: fonts.fontAnton,
    color: colorForest,
  })

  // 7. Personal Salutation
  const salutationY = subjectY - 28
  const salutation = recipient.firstName ? `Lieber ${recipient.firstName}!` : 'Lieber Abenteurer!'
  page.drawText(cleanText(salutation), {
    x: leftMargin,
    y: salutationY,
    size: 12,
    font: fonts.fontInter,
    color: colorForest,
  })

  // 8. Letter Body Text
  const bodyText =
    'hast du Lust auf ein echtes Abenteuer? Raus in die Natur, Dreck an den Wanderschuhen, knisterndes Lagerfeuer und spannende Geländespiele mit anderen Jungs!\n\n' +
    'Wir von der SMJ Regio Wegweiser laden dich ganz herzlich zu unserer nächsten großen Aktion ein. Egal ob du schon einmal dabei warst oder das erste Mal mitkommst: Es warten unvergessliche Tage, eine starke Gemeinschaft und jede Menge Action auf dich.'

  const textWidth = pageWidth - leftMargin - 56.7
  const bodyLines = wrapText(bodyText, textWidth, fonts.fontInter, 10.5)
  let curY = salutationY - 18
  for (const line of bodyLines) {
    if (line === '') {
      curY -= 8
      continue
    }
    page.drawText(cleanText(line), {
      x: leftMargin,
      y: curY,
      size: 10.5,
      font: fonts.fontInter,
      color: colorForest,
    })
    curY -= 15
  }


  // 9. Fact Cards (3 separate boxes, 2-line layout like Plakat)
  curY -= 10
  const factGap = 12
  const boxW = (textWidth - 2 * factGap) / 3
  const boxH = 56

  const factItems = [
    { label: 'WANN', value: event.dateStr },
    { label: 'WO', value: event.locationStr },
    { label: 'WER', value: event.ageStr },
  ]

  factItems.forEach((f, idx) => {
    const bx = leftMargin + idx * (boxW + factGap)

    // Box background
    page.drawRectangle({
      x: bx,
      y: curY - boxH,
      width: boxW,
      height: boxH,
      color: colorBoxBg,
      borderColor: colorBorder,
      borderWidth: 1,
    })

    // Orange left accent stripe
    page.drawRectangle({
      x: bx,
      y: curY - boxH,
      width: 4,
      height: boxH,
      color: colorOrange,
    })

    // Orange label
    page.drawText(f.label, {
      x: bx + 10,
      y: curY - 15,
      size: 8,
      font: fonts.fontMono,
      color: colorOrange,
    })

    const [line1, line2] = splitFact(f.label, f.value)

    // Line 1: Larger bold text
    let l1Size = 12
    if (line1.length > 12) l1Size = 10.5
    if (line1.length > 16) l1Size = 9.5
    page.drawText(cleanText(line1), {
      x: bx + 10,
      y: curY - 31,
      size: l1Size,
      font: fonts.fontAnton,
      color: colorForest,
    })

    // Line 2: Sub-info
    if (line2) {
      let l2Size = 8
      if (line2.length > 14) l2Size = 7.2
      page.drawText(cleanText(line2), {
        x: bx + 10,
        y: curY - 45,
        size: l2Size,
        font: fonts.fontInter,
        color: colorMuted,
      })
    }
  })

  curY -= boxH + 20

  // 10. QR-Code & Direct Registration CTA
  const qrBoxHeight = 84
  page.drawRectangle({
    x: leftMargin,
    y: curY - qrBoxHeight,
    width: textWidth,
    height: qrBoxHeight,
    color: colorForest,
    borderColor: colorOrange,
    borderWidth: 1.5,
  })

  // Embed QR-Code
  try {
    const qrDataUrl = await QRCode.toDataURL(event.registrationUrl, {
      margin: 1,
      width: 250,
      color: { dark: '#111713', light: '#FFFFFF' },
    })
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1] ?? '', 'base64')
    const qrImage = await pdfDoc.embedPng(qrImageBytes)
    const qrDim = 68
    page.drawImage(qrImage, {
      x: leftMargin + textWidth - qrDim - 8,
      y: curY - qrBoxHeight + 8,
      width: qrDim,
      height: qrDim,
    })
  } catch (e) {
    console.warn('[letter-pdf] Failed to embed QR code:', e)
  }

  page.drawText('JETZT ONLINE ANMELDEN & PLATZ SICHERN:', {
    x: leftMargin + 16,
    y: curY - 26,
    size: 13,
    font: fonts.fontAnton,
    color: colorOrange,
  })
  page.drawText(cleanText(`Link zur Anmeldung: ${event.registrationUrl.replace(/^https?:\/\//, '')}`), {
    x: leftMargin + 16,
    y: curY - 46,
    size: 9.5,
    font: fonts.fontMono,
    color: rgb(241 / 255, 235 / 255, 221 / 255),
  })
  page.drawText('Scanne einfach den QR-Code mit dem Smartphone oder gib die Adresse im Browser ein.', {
    x: leftMargin + 16,
    y: curY - 64,
    size: 8.5,
    font: fonts.fontInter,
    color: rgb(201 / 255, 186 / 255, 153 / 255),
  })

  curY -= qrBoxHeight + 20

  // 11. Parents Note Box (Wichtiger Hinweis für Eltern)
  const parentBoxHeight = 56
  page.drawRectangle({
    x: leftMargin,
    y: curY - parentBoxHeight,
    width: textWidth,
    height: parentBoxHeight,
    color: colorBoxBg,
    borderColor: colorBorder,
    borderWidth: 0.75,
  })
  page.drawText('// WICHTIGER HINWEIS FÜR DEINE ELTERN:', {
    x: leftMargin + 12,
    y: curY - 18,
    size: 8.5,
    font: fonts.fontAnton,
    color: colorForest,
  })
  const parentNote =
    'Liebe Eltern: Alle Details zu Aufsicht, Betreuungsteam, Vollverpflegung sowie die vollständige Packliste finden Sie direkt online auf unserer Website unter smj-wegweiser.de. Bei Fragen erreichen Sie uns jederzeit!'
  const parentLines = wrapText(parentNote, textWidth - 24, fonts.fontInter, 8)
  parentLines.forEach((l, idx) => {
    page.drawText(cleanText(l), {
      x: leftMargin + 12,
      y: curY - 31 - idx * 11,
      size: 8,
      font: fonts.fontInter,
      color: colorMuted,
    })
  })

  curY -= parentBoxHeight + 24

  // 12. Sign-off & Team Signature
  page.drawText('Wir freuen uns riesig auf dich und das gemeinsame Abenteuer!', {
    x: leftMargin,
    y: curY,
    size: 10,
    font: fonts.fontInter,
    color: colorForest,
  })
  page.drawText('Beste Grüße & Raus ins Abenteuer,', {
    x: leftMargin,
    y: curY - 15,
    size: 10,
    font: fonts.fontInter,
    color: colorForest,
  })
  page.drawText('Dein Leitungsteam der SMJ Regio Wegweiser', {
    x: leftMargin,
    y: curY - 32,
    size: 11,
    font: fonts.fontAnton,
    color: colorOrange,
  })

  // 13. Footer
  const footerY = 28
  page.drawLine({
    start: { x: leftMargin, y: footerY + 12 },
    end: { x: pageWidth - 56.7, y: footerY + 12 },
    thickness: 0.5,
    color: colorBorder,
  })
  page.drawText('SMJ Regio Wegweiser • Klause 2.0 • Pater-Kentenich-Weg 3 • 37308 Heilbad Heiligenstadt • smj-wegweiser.de', {
    x: leftMargin,
    y: footerY,
    size: 7.5,
    font: fonts.fontInter,
    color: colorMuted,
  })
}

/**
 * Generates a single personalized letter PDF as a Buffer.
 */
export async function generateSingleLetterPdf(
  recipient: CiviRecipient,
  event: CampaignEventData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fontAnton = await pdfDoc.embedFont(loadFontBuffer('Anton-Regular.ttf'))
  const fontInter = await pdfDoc.embedFont(loadFontBuffer('Inter-Regular.ttf'))
  const fontMono = await pdfDoc.embedFont(loadFontBuffer('SpaceMono-Bold.ttf'))

  await appendLetterPage(pdfDoc, recipient, event, {
    fontAnton,
    fontInter,
    fontMono,
  })

  return await pdfDoc.save()
}

/**
 * Generates a multi-page batch PDF containing all personalized letters for bulk printing.
 */
export async function generateLetterBatchPdf(
  recipients: CiviRecipient[],
  event: CampaignEventData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fontAnton = await pdfDoc.embedFont(loadFontBuffer('Anton-Regular.ttf'))
  const fontInter = await pdfDoc.embedFont(loadFontBuffer('Inter-Regular.ttf'))
  const fontMono = await pdfDoc.embedFont(loadFontBuffer('SpaceMono-Bold.ttf'))

  for (const recipient of recipients) {
    await appendLetterPage(pdfDoc, recipient, event, {
      fontAnton,
      fontInter,
      fontMono,
    })
  }

  return await pdfDoc.save()
}
