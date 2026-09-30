import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from 'pdf-lib'
import QRCode from 'qrcode'
import { splitFact } from '../lib/campaigns/split-fact'
import type { CiviRecipient, CampaignEventData } from '../lib/civicrm/types'

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

const ICON_SVGS: Record<string, string> = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>`,
  'map-pin': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
}

async function renderSvgToPngBytes(svgStr: string, size = 64): Promise<Uint8Array | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  return new Promise((resolve) => {
    try {
      const img = new Image()
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            URL.revokeObjectURL(url)
            return resolve(null)
          }
          ctx.drawImage(img, 0, 0, size, size)
          URL.revokeObjectURL(url)
          canvas.toBlob((blob) => {
            if (!blob) return resolve(null)
            blob
              .arrayBuffer()
              .then((buf) => resolve(new Uint8Array(buf)))
              .catch(() => resolve(null))
          }, 'image/png')
        } catch {
          URL.revokeObjectURL(url)
          resolve(null)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    } catch {
      resolve(null)
    }
  })
}

let cachedLogoBytes: Uint8Array | null = null
async function fetchLogoBytes(): Promise<Uint8Array | null> {
  if (cachedLogoBytes) return cachedLogoBytes
  try {
    const res = await fetch('/logo_wegweiser_dark.png')
    if (res.ok) {
      const buf = await res.arrayBuffer()
      cachedLogoBytes = new Uint8Array(buf)
      return cachedLogoBytes
    }
  } catch (e) {
    console.warn('[client-letter-batch] Logo fetch failed:', e)
  }
  return null
}

function appendClientLetterPage(
  pdfDoc: PDFDocument,
  recipient: CiviRecipient,
  event: CampaignEventData,
  fonts: {
    fontBold: PDFFont
    fontRegular: PDFFont
    fontMono: PDFFont
  },
  assets: {
    logoImg?: PDFImage
    qrImg?: PDFImage
    iconCalendar?: PDFImage
    iconMapPin?: PDFImage
    iconUsers?: PDFImage
  },
): void {
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
  if (assets.logoImg) {
    try {
      page.drawImage(assets.logoImg, {
        x: pageWidth / 2 - 120,
        y: pageHeight / 2 - 105,
        width: 240,
        height: 210,
        opacity: 0.08,
      })
    } catch {}
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
  const brandTitleWidth = fonts.fontBold.widthOfTextAtSize('SMJ REGIO WEGWEISER', 19)

  if (assets.logoImg) {
    try {
      const logoW = 38
      const logoH = 33.3
      page.drawImage(assets.logoImg, {
        x: headerRight - brandTitleWidth - logoW - 10,
        y: pageHeight - 60,
        width: logoW,
        height: logoH,
      })
    } catch {}
  }

  page.drawText('SMJ REGIO WEGWEISER', {
    x: headerRight - brandTitleWidth,
    y: pageHeight - 48,
    size: 19,
    font: fonts.fontBold,
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
  const leftMargin = 56.7 // 20mm from left
  const senderLineY = pageHeight - 128
  const senderLineText = 'Regio Wegweiser • Pater-Kentenich-Weg 3 • 37308 Heiligenstadt'
  page.drawText(senderLineText, {
    x: leftMargin,
    y: senderLineY,
    size: 7.5,
    font: fonts.fontRegular,
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
    recipient.displayName || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'Abenteurer',
    addr?.street || (recipient as any).street || '',
    addr
      ? `${addr.postalCode} ${addr.city}`
      : (recipient as any).postalCode
        ? `${(recipient as any).postalCode} ${(recipient as any).city || ''}`.trim()
        : '',
  ].filter(Boolean)

  if (addrLines.length > 0) {
    addrLines.forEach((l, idx) => {
      page.drawText(cleanText(l), {
        x: leftMargin,
        y: addrStartY - idx * 13,
        size: 10,
        font: fonts.fontRegular,
        color: colorForest,
      })
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
    font: fonts.fontBold,
    color: colorForest,
  })
  page.drawText('Klause 2.0', {
    x: infoX,
    y: infoY - 12,
    size: 8,
    font: fonts.fontRegular,
    color: colorForest,
  })
  page.drawText('Pater-Kentenich-Weg 3', {
    x: infoX,
    y: infoY - 22,
    size: 8,
    font: fonts.fontRegular,
    color: colorForest,
  })
  page.drawText('37308 Heilbad Heiligenstadt', {
    x: infoX,
    y: infoY - 32,
    size: 8,
    font: fonts.fontRegular,
    color: colorForest,
  })
  page.drawText('smj-wegweiser.de', {
    x: infoX,
    y: infoY - 42,
    size: 8,
    font: fonts.fontRegular,
    color: colorForest,
  })
  page.drawText('Datum: ' + today, {
    x: infoX,
    y: infoY - 60,
    size: 8,
    font: fonts.fontRegular,
    color: colorMuted,
  })

  // 6. Subject Line (Betreffzeile) at ~280 pt from top
  const subjectY = pageHeight - 275
  page.drawText('// PERSÖNLICHE EINLADUNG', {
    x: leftMargin,
    y: subjectY + 26,
    size: 11,
    font: fonts.fontBold,
    color: colorOrange,
  })
  const subject = `DEIN NÄCHSTES ABENTEUER: ${event.title.toUpperCase()}`
  page.drawText(cleanText(subject), {
    x: leftMargin,
    y: subjectY,
    size: 16,
    font: fonts.fontBold,
    color: colorForest,
  })

  // 7. Personal Salutation
  const salutationY = subjectY - 28
  const salutation = recipient.firstName ? `Lieber ${recipient.firstName}!` : 'Lieber Abenteurer!'
  page.drawText(cleanText(salutation), {
    x: leftMargin,
    y: salutationY,
    size: 12,
    font: fonts.fontRegular,
    color: colorForest,
  })

  // 8. Letter Body Text
  const bodyText =
    'hast du Lust auf ein echtes Abenteuer? Raus in die Natur, Dreck an den Wanderschuhen, knisterndes Lagerfeuer und spannende Geländespiele mit anderen Jungs!\n\n' +
    'Wir von der SMJ Regio Wegweiser laden dich ganz herzlich zu unserer nächsten großen Aktion ein. Egal ob du schon einmal dabei warst oder das erste Mal mitkommst: Es warten unvergessliche Tage, eine starke Gemeinschaft und jede Menge Action auf dich.'

  const textWidth = pageWidth - leftMargin - 56.7
  const bodyLines = wrapText(bodyText, textWidth, fonts.fontRegular, 10.5)
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
      font: fonts.fontRegular,
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
    { label: 'WANN', value: event.dateStr, icon: assets.iconCalendar },
    { label: 'WO', value: event.locationStr, icon: assets.iconMapPin },
    { label: 'WER', value: event.ageStr, icon: assets.iconUsers },
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

    // Orange label & Icon
    const iconSize = 9
    if (f.icon) {
      try {
        page.drawImage(f.icon, {
          x: bx + 10,
          y: curY - 17,
          width: iconSize,
          height: iconSize,
        })
      } catch {}
    }

    page.drawText(f.label, {
      x: bx + (f.icon ? 10 + iconSize + 3.5 : 10),
      y: curY - 15,
      size: 8,
      font: fonts.fontMono,
      color: colorOrange,
    })

    const [line1, line2] = splitFact(f.label, f.value)

    // Line 1: Larger bold text
    let l1Size = 11
    if (line1.length > 12) l1Size = 10
    if (line1.length > 16) l1Size = 9
    page.drawText(cleanText(line1), {
      x: bx + 10,
      y: curY - 31,
      size: l1Size,
      font: fonts.fontBold,
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
        font: fonts.fontRegular,
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
  if (assets.qrImg) {
    try {
      const qrDim = 68
      page.drawImage(assets.qrImg, {
        x: leftMargin + textWidth - qrDim - 8,
        y: curY - qrBoxHeight + 8,
        width: qrDim,
        height: qrDim,
      })
    } catch {}
  }

  // QR Box Text Content
  const qrInnerX = leftMargin + 14
  page.drawText('JETZT ONLINE ANMELDEN', {
    x: qrInnerX,
    y: curY - 22,
    size: 11,
    font: fonts.fontBold,
    color: colorOrange,
  })
  page.drawText('Scanne den QR-Code mit der Smartphone-Kamera oder melde dich direkt im Web an:', {
    x: qrInnerX,
    y: curY - 36,
    size: 8.5,
    font: fonts.fontRegular,
    color: rgb(241 / 255, 235 / 255, 221 / 255),
  })
  page.drawText(cleanText(event.registrationUrl), {
    x: qrInnerX,
    y: curY - 50,
    size: 8.5,
    font: fonts.fontMono,
    color: colorOrange,
  })
  page.drawText('Dort findest du auch alle Packlisten, Kosten und Infos für deine Eltern.', {
    x: qrInnerX,
    y: curY - 64,
    size: 8,
    font: fonts.fontRegular,
    color: rgb(180 / 255, 185 / 255, 175 / 255),
  })

  curY -= qrBoxHeight + 24

  // 11. Closing Sign-off
  page.drawText('Beste Grüße und bis bald auf Tour!', {
    x: leftMargin,
    y: curY,
    size: 10.5,
    font: fonts.fontRegular,
    color: colorForest,
  })
  page.drawText('Dein Leitungsteam der SMJ Regio Wegweiser', {
    x: leftMargin,
    y: curY - 16,
    size: 10.5,
    font: fonts.fontBold,
    color: colorForest,
  })

  // 12. Footer Line
  const footerY = 38
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
    font: fonts.fontRegular,
    color: colorMuted,
  })
}

export async function generateClientLetterBatchPdf(
  recipients: CiviRecipient[],
  event: CampaignEventData,
  onProgress?: (current: number, total: number) => void,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(`SMJ Anschreiben Sammeldruck: ${cleanText(event.title)}`)
  pdfDoc.setAuthor('SMJ Regio Wegweiser')
  pdfDoc.setCreator('SMJ Regio Wegweiser Leiter-Toolbox')

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold)

  // Pre-load assets
  const logoBytes = await fetchLogoBytes()
  let logoImg: PDFImage | undefined
  if (logoBytes) {
    try {
      logoImg = await pdfDoc.embedPng(logoBytes)
    } catch {}
  }

  // Pre-generate QR-Code
  let qrImg: PDFImage | undefined
  try {
    const qrDataUrl = await QRCode.toDataURL(event.registrationUrl, {
      margin: 1,
      width: 250,
      color: { dark: '#111713', light: '#FFFFFF' },
    })
    const qrB64 = qrDataUrl.split(',')[1] || ''
    const qrBytes = Uint8Array.from(atob(qrB64), (c) => c.charCodeAt(0))
    qrImg = await pdfDoc.embedPng(qrBytes)
  } catch {}

  // Pre-generate icons
  let iconCalendar: PDFImage | undefined
  let iconMapPin: PDFImage | undefined
  let iconUsers: PDFImage | undefined
  try {
    const [bCal, bPin, bUsr] = await Promise.all([
      renderSvgToPngBytes(ICON_SVGS.calendar!),
      renderSvgToPngBytes(ICON_SVGS['map-pin']!),
      renderSvgToPngBytes(ICON_SVGS.users!),
    ])
    if (bCal) iconCalendar = await pdfDoc.embedPng(bCal)
    if (bPin) iconMapPin = await pdfDoc.embedPng(bPin)
    if (bUsr) iconUsers = await pdfDoc.embedPng(bUsr)
  } catch {}

  const total = recipients.length
  for (let i = 0; i < total; i++) {
    const recipient = recipients[i]!
    if (onProgress) onProgress(i + 1, total)

    appendClientLetterPage(
      pdfDoc,
      recipient,
      event,
      { fontBold, fontRegular, fontMono },
      { logoImg, qrImg, iconCalendar, iconMapPin, iconUsers },
    )
  }

  return await pdfDoc.save()
}

export function downloadPdfBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
