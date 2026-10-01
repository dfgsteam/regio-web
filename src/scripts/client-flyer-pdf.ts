import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'

export interface ClientFlyerData {
  title: string
  subtitle?: string
  targetUrl: string
  dateStr?: string
  locationStr?: string
  ageStr?: string
  priceStr?: string
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

export async function generateClientFlyerPdf(data: ClientFlyerData): Promise<Uint8Array> {
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

  // Expedition border lines
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

  const marginX = 36
  const contentW = W - 2 * marginX // 523.28 pt

  // QR Code PNG
  const qrDataUrl = await QRCode.toDataURL(data.targetUrl, {
    margin: 1,
    width: 600,
    color: {
      dark: '#111713',
      light: '#FFFFFF',
    },
  })
  const qrBase64 = qrDataUrl.split(',')[1] || ''
  const qrBytes = Uint8Array.from(atob(qrBase64), (c) => c.charCodeAt(0))
  const qrImage = await doc.embedPng(qrBytes)

  // Fetch Logo PNG from site
  let logoImage
  try {
    const res = await fetch('/logo_wegweiser_dark.png')
    if (res.ok) {
      const logoBuf = await res.arrayBuffer()
      logoImage = await doc.embedPng(logoBuf)
    }
  } catch (e) {
    console.warn('Could not fetch logo_wegweiser_dark.png', e)
  }

  // --- HEADER SECTION ---
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
  page.drawText('SMJ REGIO WEGWEISER', {
    x: headerTextX,
    y: headerTopY - 18,
    size: 10,
    font: fontBold,
    color: cOrange,
  })

  page.drawText('Schoenstatt-Mannesjugend - smj-wegweiser.de', {
    x: headerTextX,
    y: headerTopY - 32,
    size: 8,
    font: fontRegular,
    color: cMuted,
  })

  // Category Badge (Top Right)
  const categoryStr = 'AKTION'
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

  // --- TITLE & CLAIM SECTION ---
  let currY = headerDividerY - 22

  page.drawText('//  RAUS. INS ABENTEUER.', {
    x: marginX,
    y: currY,
    size: 9.5,
    font: fontBold,
    color: cOrange,
  })

  currY -= 28

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
    { label: 'WANN', value: cleanText(data.dateStr || 'Demnaechst') },
    { label: 'WO', value: cleanText(data.locationStr || 'Infos online') },
    { label: 'WER', value: cleanText(data.ageStr || 'Jungs von 9-14 Jahren') },
    { label: 'BEITRAG', value: cleanText(data.priceStr || 'Auf Anfrage') },
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
      y: currY - 14,
      size: 7.5,
      font: fontBold,
      color: cOrange,
    })

    let val = fact.value
    let valSize = 8
    if (val.length > 21) valSize = 7
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

  const highlights = [
    { title: 'Gemeinschaft & Lagerfeuer', desc: 'Zelte bauen, Nachtwache halten, neue Freunde finden.' },
    { title: 'Grosses Gelaendespiel & Action', desc: 'Spannende Wettkaempfe, Abenteuer im Wald und Workshops.' },
    { title: 'Erfahrene Betreuung', desc: 'Jugend leitet Jugend mit Vollverpflegung und erfahrenen Leitern.' },
  ]

  for (const h of highlights) {
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
      size: 10,
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

    currY -= 32
  }

  // --- REGISTRATION & CONTACT BOX (Fills bottom area) ---
  const footerY = 28
  const regBoxBottomY = footerY + 16
  const regBoxH = Math.max(160, currY - regBoxBottomY)
  const regBoxY = regBoxBottomY

  page.drawRectangle({
    x: marginX,
    y: regBoxY,
    width: contentW,
    height: regBoxH,
    color: cWhite,
    borderColor: cForest,
    borderWidth: 2,
  })

  const regTextX = marginX + 16
  let cardInnerY = regBoxY + regBoxH - 18

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

  const cleanUrl = cleanText(data.targetUrl.replace(/^https?:\/\//, ''))
  page.drawText(`->  ${cleanUrl}`, {
    x: regTextX,
    y: cardInnerY,
    size: 9.5,
    font: fontBold,
    color: cOrange,
  })

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
    `SMJ Regio Wegweiser - Jugend leitet Jugend - Schoenstatt-Mannesjugend - Stand: ${new Date().getFullYear()}`,
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

/**
 * Generates and downloads or opens the custom flyer PDF in the browser.
 */
export async function openOrDownloadClientFlyerPdf(
  data: ClientFlyerData,
  mode: 'open' | 'download' = 'open',
): Promise<void> {
  const bytes = await generateClientFlyerPdf(data)
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const blobUrl = URL.createObjectURL(blob)

  const cleanFilename = `SMJ-Flyer-${cleanText(data.title).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`

  if (mode === 'download') {
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = cleanFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
  } else {
    // Open directly in browser / OS PDF viewer in new tab
    const win = window.open(blobUrl, '_blank')
    if (!win) {
      // If popup blocked, fallback to download
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = cleanFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  }
}
