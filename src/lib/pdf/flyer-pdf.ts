import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ResolvedFlyerData } from './flyer-content'
import { embedIcon } from './pdf-icons'

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

async function getHeroBannerBuffer(
  slug: string,
  title: string,
  category: string,
): Promise<{ buffer: Buffer; stampText: string } | null> {
  try {
    const { default: sharp } = await import('sharp')
    const norm = `${slug} ${title} ${category}`.toLowerCase()
    let chosenFile = 'expect-action.jpg'
    let stampText = 'SPASS & ACTION • SMJ REGIO'

    if (norm.includes('zeltlager') || norm.includes('camp')) {
      chosenFile = 'hero-camp.jpg'
      stampText = 'ZELTLAGER EXPEDITION • WIESENTHAL'
    } else if (norm.includes('sterntreffen') || norm.includes('nachtreffen')) {
      chosenFile = 'reel-04-gemeinschaft.jpg'
      stampText = 'ZELTLAGER-REVUE & WIEDERSEHEN • SMJ'
    } else if (norm.includes('action') || norm.includes('wochenende')) {
      chosenFile = 'expect-action.jpg'
      stampText = 'ACTION & ZEIT UNTER JUNGS • KLAUSE 2.0'
    } else if (fs.existsSync('src/assets/images/reel-01-aufbruch.jpg')) {
      chosenFile = 'reel-01-aufbruch.jpg'
      stampText = 'RAUS INS ABENTEUER • SMJ WEGWEISER'
    }

    const p = path.resolve(process.cwd(), 'src/assets/images', chosenFile)
    if (fs.existsSync(p)) {
      const buffer = await sharp(p)
        .resize(1200, 420, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toBuffer()
      return { buffer, stampText }
    }
  } catch (e) {
    console.warn('[flyer-pdf] Failed to load/resize hero banner:', e)
  }
  return null
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

  doc.setTitle(`SMJ Werbeplakat: ${cleanText(data.title)}`)
  doc.setAuthor('SMJ Regio Wegweiser')
  doc.setCreator('SMJ Regio Wegweiser Leiter-Toolbox')

  // DIN A4: 210mm x 297mm = 595.28 x 841.89 pt
  const W = 595.28
  const H = 841.89
  const page = doc.addPage([W, H])

  // Brand Palette
  const cForest = rgb(17 / 255, 23 / 255, 19 / 255) // #111713
  const cPaper = rgb(241 / 255, 235 / 255, 221 / 255) // #F1EBDD
  const cOrange = rgb(255 / 255, 90 / 255, 31 / 255) // #FF5A1F
  const cSand = rgb(201 / 255, 186 / 255, 153 / 255) // #C9BA99
  const cWhite = rgb(1, 1, 1)
  const cMuted = rgb(100 / 255, 105 / 255, 98 / 255)

  // 1. Embed Brand Fonts (Anton for Display, Space Mono for Utility, Inter for Body)
  let fontDisplay: PDFFont
  let fontMono: PDFFont
  let fontBody: PDFFont

  try {
    fontDisplay = await doc.embedFont(loadFontBuffer('Anton-Regular.ttf'))
  } catch (err) {
    console.error('[flyer-pdf] Failed to load Anton-Regular.ttf:', err)
    fontDisplay = await doc.embedFont(StandardFonts.HelveticaBold)
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

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: cPaper,
  })

  // Double Expedition Borders
  page.drawRectangle({
    x: 16,
    y: 16,
    width: W - 32,
    height: H - 32,
    borderColor: cForest,
    borderWidth: 2.5,
  })

  page.drawRectangle({
    x: 20,
    y: 20,
    width: W - 40,
    height: H - 40,
    borderColor: cSand,
    borderWidth: 0.75,
  })

  // Margins
  const marginX = 36
  const contentW = W - 2 * marginX // 523.28 pt

  // QR Code Generation
  const qrPngBuffer = await QRCode.toBuffer(data.targetUrl, {
    margin: 1,
    width: 500,
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

  // Load and embed Lucide Vector Icons
  const [
    iconCompass,
    iconCalendar,
    iconMapPin,
    iconUsers,
    iconBanknote,
    iconExternalLink,
    iconCheckCircle,
    iconPhone,
    iconMail,
    iconUserCheck,
    iconArrowUp,
  ] = await Promise.all([
    embedIcon(doc, 'compass', '#FF5A1F'),
    embedIcon(doc, 'calendar', '#FF5A1F'),
    embedIcon(doc, 'map-pin', '#FF5A1F'),
    embedIcon(doc, 'users', '#FF5A1F'),
    embedIcon(doc, 'banknote', '#FF5A1F'),
    embedIcon(doc, 'external-link', '#FF5A1F'),
    embedIcon(doc, 'check-circle', '#FF5A1F'),
    embedIcon(doc, 'phone', '#FF5A1F'),
    embedIcon(doc, 'mail', '#FF5A1F'),
    embedIcon(doc, 'user-check', '#111713'),
    embedIcon(doc, 'arrow-up', '#111713'),
  ])

  // --- HEADER SECTION ---
  const headerTopY = H - 34
  const logoSize = 40

  if (logoImage) {
    page.drawImage(logoImage, {
      x: marginX,
      y: headerTopY - logoSize,
      width: logoSize,
      height: logoSize,
    })
  }

  const headerTextX = logoImage ? marginX + logoSize + 12 : marginX
  page.drawText('SMJ REGIO WEGWEISER • HEILIGENSTADT', {
    x: headerTextX,
    y: headerTopY - 14,
    size: 10.5,
    font: fontMono,
    color: cOrange,
  })

  page.drawText('SCHÖNSTATT MANNESJUGEND • SMJ-WEGWEISER.DE', {
    x: headerTextX,
    y: headerTopY - 28,
    size: 7.5,
    font: fontBody,
    color: cMuted,
  })

  // Category Badge (Top Right)
  const categoryStr = cleanText((data.categoryLabel || 'AKTION').toUpperCase())
  const catSize = 8.5
  const catTextWidth = fontBold.widthOfTextAtSize(categoryStr, catSize)
  const catPadX = 12
  const catBadgeW = catTextWidth + 2 * catPadX
  const catBadgeH = 20
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
    x: catBadgeX + catPadX,
    y: catBadgeY + 6,
    size: catSize,
    font: fontBold,
    color: cWhite,
  })

  // Header Divider Line
  const headerDividerY = headerTopY - logoSize - 8
  page.drawLine({
    start: { x: marginX, y: headerDividerY },
    end: { x: W - marginX, y: headerDividerY },
    thickness: 2,
    color: cForest,
  })

  // --- TITLE & MOTTO SECTION ---
  let currY = headerDividerY - 22

  page.drawImage(iconCompass, {
    x: marginX,
    y: currY - 1,
    width: 11,
    height: 11,
  })

  page.drawText('RAUS. INS ABENTEUER.', {
    x: marginX + 15,
    y: currY,
    size: 9.5,
    font: fontMono,
    color: cOrange,
  })

  currY -= 48

  // Main Event Title (Anton display font)
  const titleText = cleanText(data.title.toUpperCase())
  let titleFontSize = 42
  if (titleText.length > 20) titleFontSize = 36
  if (titleText.length > 26) titleFontSize = 30

  page.drawText(titleText, {
    x: marginX,
    y: currY,
    size: titleFontSize,
    font: fontDisplay,
    color: cForest,
  })

  currY -= 20

  // Subtitle / Motto in Anton display font
  let rawMotto = data.subtitle
    ? `// ${data.subtitle.toUpperCase()}`
    : '// DRECK AN DEN SCHUHEN. RAUCH IN DEN KLAMOTTEN. GESCHICHTEN IM KOPF.'

  if (rawMotto.includes('HERZLICHE EINLADUNG') || rawMotto.length > 70) {
    rawMotto = '// DRECK AN DEN SCHUHEN. RAUCH IN DEN KLAMOTTEN. GESCHICHTEN IM KOPF.'
  }

  const mottoLines = wrapText(rawMotto, contentW, fontDisplay, 12.5).slice(0, 2)
  for (const mLine of mottoLines) {
    page.drawText(cleanText(mLine), {
      x: marginX,
      y: currY,
      size: 12.5,
      font: fontDisplay,
      color: cOrange,
    })
    currY -= 15
  }
  currY -= 2

  // --- CINEMATIC HERO IMAGE BANNER ---
  const bannerInfo = await getHeroBannerBuffer(data.id, data.title, data.categoryLabel)
  const imgH = 166
  currY -= imgH + 4
  const imgY = currY

  if (bannerInfo) {
    try {
      const bannerImg = await doc.embedJpg(bannerInfo.buffer)
      page.drawImage(bannerImg, {
        x: marginX,
        y: imgY,
        width: contentW,
        height: imgH,
      })

      // Border around photo
      page.drawRectangle({
        x: marginX,
        y: imgY,
        width: contentW,
        height: imgH,
        borderColor: cForest,
        borderWidth: 1.5,
      })

      // Expedition Stamp Badge on Image
      const rawStamp = bannerInfo.stampText || ''
      const stampText = rawStamp.replace(/[–—]/g, '-').trim()
      const stampFontSize = 8
      const stampTextW = fontBold.widthOfTextAtSize(stampText, stampFontSize)
      const stampPadX = 10
      const stampW = stampTextW + 2 * stampPadX
      const stampH = 19
      const stampX = marginX + 12
      const stampY = imgY + 12

      page.drawRectangle({
        x: stampX,
        y: stampY,
        width: stampW,
        height: stampH,
        color: cForest,
      })
      page.drawText(stampText, {
        x: stampX + stampPadX,
        y: stampY + 5.5,
        size: stampFontSize,
        font: fontBold,
        color: cOrange,
      })
    } catch (e) {
      console.warn('[flyer-pdf] Failed to embed hero banner:', e)
    }
  }

function splitFact(label: string, rawVal: string): [string, string] {
  const v = (rawVal || '').trim()
  const u = v.toUpperCase().replace(/[–—]/g, '-')

  if (label === 'WANN') {
    const m = u.match(/^([0-9.\s-]+)\s+([A-ZÄÖÜ]+\.?\s*[0-9]*)$/)
    if (m && m[1] && m[2]) return [m[1].trim(), m[2].trim()]
    const parts = u.split(/\s+/)
    if (parts.length >= 3) {
      const p1 = parts.slice(0, parts.length - 2).join(' ')
      const p2 = parts.slice(-2).join(' ')
      return [p1, p2]
    }
  }

  if (label === 'WO') {
    if (u.includes(',')) {
      const p = u.split(',')
      if (p[0] && p[1]) {
        const l1 = p[0].replace(/ZELTPLATZ\s+/i, '').trim()
        const l2 = p[1].trim()
        return [l1, l2]
      }
    }
    if (u.includes(' BEI ')) {
      const p = u.split(' BEI ')
      if (p[0] && p[1]) {
        return [p[0].trim(), p[1].trim()]
      }
    }
  }

  if (label === 'WER') {
    const m = u.match(/([0-9]+\s*[-]\s*[0-9]+)/)
    if (m && m[1]) {
      return [m[1].replace(/\s+/g, ' ') + ' JAHRE', 'FÜR JUNGS']
    }
    if (u.includes('AB ')) {
      return [u, 'FÜR JUGENDLICHE']
    }
  }

  if (label === 'BEITRAG') {
    const m = u.match(/^([0-9]+\s*€|\d+\s*EURO)/i)
    if (m && m[1]) {
      const l1 = m[1].replace(/EURO/i, '€')
      let l2 = 'INKL. VERPFLEGUNG'
      if (u.includes('VOLLPENSION') || u.includes('10 TAGE') || u.includes('ZELTLAGER')) {
        l2 = 'INKL. VOLLPENSION'
      } else if (u.includes('ESSEN')) {
        l2 = 'INKL. ESSEN'
      }
      return [l1, l2]
    }
    if (u.includes('ANFRAGE')) {
      return ['AUF ANFRAGE', 'INFOS ONLINE']
    }
  }

  const words = u.split(/\s+/)
  if (words.length <= 1) return [u, '']
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

  // --- 4 KEY FACTS CARDS (2-LINE WITH LARGER BOLD TEXT) ---
  currY -= 68
  const factGap = 8
  const cardW = (contentW - 3 * factGap) / 4
  const cardH = 60

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
      y: currY,
      width: cardW,
      height: cardH,
      color: cForest,
    })

    const factIcons = [iconCalendar, iconMapPin, iconUsers, iconBanknote]
    const ic = factIcons[i]
    if (ic) {
      page.drawImage(ic, {
        x: cardX + 10,
        y: currY + cardH - 16,
        width: 10,
        height: 10,
      })
    }

    // Orange label
    page.drawText(fact.label, {
      x: cardX + 23,
      y: currY + cardH - 14,
      size: 7.5,
      font: fontMono,
      color: cOrange,
    })

    const [line1, line2] = splitFact(fact.label, fact.value)

    // Line 1: Larger, bold
    let l1Size = 11.5
    if (line1.length > 12) l1Size = 10.5
    if (line1.length > 15) l1Size = 9.5
    page.drawText(line1, {
      x: cardX + 10,
      y: currY + cardH - 30,
      size: l1Size,
      font: fontMono,
      color: cPaper,
    })

    // Line 2: Sub-info
    if (line2) {
      let l2Size = 8
      if (line2.length > 14) l2Size = 7.2
      page.drawText(line2, {
        x: cardX + 10,
        y: currY + 12,
        size: l2Size,
        font: fontMono,
        color: cSand,
      })
    }
  })

  // --- HIGHLIGHTS / WAS DICH ERWARTET ---
  currY -= 24
  const secTitle = 'WAS DICH BEI DIESER AKTION ERWARTET:'
  const secTitleW = fontMono.widthOfTextAtSize(secTitle, 9)
  page.drawText(secTitle, {
    x: marginX,
    y: currY,
    size: 9,
    font: fontMono,
    color: cForest,
  })

  page.drawLine({
    start: { x: marginX, y: currY - 5 },
    end: { x: marginX + secTitleW + 4, y: currY - 5 },
    thickness: 1,
    color: cSand,
  })

  currY -= 24

  // Default highlights tailored by category
  let defaultHighlights = [
    { num: '01', title: 'GELÄNDESPIELE & WALDACTION', desc: 'Mutproben, Taktikspiele und packende Abenteuer draußen.' },
    { num: '02', title: 'COOLE AUSFLÜGE & HIGHLIGHTS', desc: 'Aktionen mit Spaßgarantie wie Schwimmbad, Kino oder Turniere.' },
    { num: '03', title: 'ZEIT UNTER JUNGS & HANDYFREI', desc: 'Echte Freunde finden, Bildungs-Inputs und 100% handyfreie Zeit.' },
  ]

  const normCat = `${data.id} ${data.title} ${data.categoryLabel}`.toLowerCase()
  if (normCat.includes('zeltlager') || normCat.includes('camp')) {
    defaultHighlights = [
      { num: '01', title: 'EXPEDITION & ZELTSTADT', desc: 'Großes Zeltlager, Nachtwache und Leben mitten in der freien Natur.' },
      { num: '02', title: 'GELÄNDESPIELE & ABENTEUER', desc: 'Spannende Lagerthemen, Waldspiele und echte Herausforderungen.' },
      { num: '03', title: 'GEMEINSCHAFT AM LAGERFEUER', desc: 'Zusammen am Feuer sitzen, Lieder singen und Freundschaften schließen.' },
    ]
  } else if (normCat.includes('sterntreffen') || normCat.includes('nachtreffen')) {
    defaultHighlights = [
      { num: '01', title: 'ZELTLAGER-REVUE & FOTOSHOW', desc: 'Die besten Momente des Zeltlagers auf der Großleinwand feiern.' },
      { num: '02', title: 'GROSSES WIEDERSEHEN DER CREW', desc: 'Wiedersehen mit deiner Zeltgemeinschaft, Leitern und Freunden.' },
      { num: '03', title: 'GELÄNDESPIELE & GEMEINSCHAFT', desc: 'Packende Spiele im Wald und 100% handyfreie Zeit unter Jungs.' },
    ]
  }

  const highlightsToUse = data.highlights && data.highlights.length >= 3
    ? data.highlights.slice(0, 3).map((h, idx) => ({
        num: `0${idx + 1}`,
        title: cleanText(h.title.toUpperCase()),
        desc: cleanText(h.desc),
      }))
    : defaultHighlights

  for (const h of highlightsToUse) {
    page.drawText(h.num, {
      x: marginX,
      y: currY - 2,
      size: 16,
      font: fontDisplay,
      color: cOrange,
    })

    page.drawText(h.title, {
      x: marginX + 30,
      y: currY,
      size: 13.5,
      font: fontDisplay,
      color: cForest,
    })

    page.drawText(h.desc, {
      x: marginX + 30,
      y: currY - 14,
      size: 9,
      font: fontBody,
      color: cForest,
    })

    currY -= 34
  }

  // --- CALL-TO-ACTION & REGISTRATION HERO BOX ---
  const footerY = 22
  const regBoxH = 170
  const regBoxY = footerY + 16

  // Box background & double border
  page.drawRectangle({
    x: marginX,
    y: regBoxY,
    width: contentW,
    height: regBoxH,
    color: cWhite,
    borderColor: cForest,
    borderWidth: 2,
  })

  // Inner subtle accent frame
  page.drawRectangle({
    x: marginX + 3,
    y: regBoxY + 3,
    width: contentW - 6,
    height: regBoxH - 6,
    borderColor: cSand,
    borderWidth: 0.5,
  })

  // Left Content Area
  const innerX = marginX + 18
  const badgeText = 'ONLINE-ANMELDUNG & INFOS'
  const badgeSize = 7.5
  const badgeTextW = fontBold.widthOfTextAtSize(badgeText, badgeSize)
  const badgePadX = 8
  const badgeW = badgeTextW + 2 * badgePadX
  const badgeH = 16
  const badgeY = regBoxY + regBoxH - 16 - badgeH

  // Orange Badge
  page.drawRectangle({
    x: innerX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    color: cOrange,
  })
  page.drawText(badgeText, {
    x: innerX + badgePadX,
    y: badgeY + 4.5,
    size: badgeSize,
    font: fontBold,
    color: cForest,
  })

  // Headline below badge with proper margin
  let inY = badgeY - 20

  page.drawText('BIST DU BEREIT? JETZT DABEI SEIN!', {
    x: innerX,
    y: inY,
    size: 19,
    font: fontDisplay,
    color: cForest,
  })

  inY -= 16

  page.drawText('Kamera ans Handy halten oder Link im Browser öffnen:', {
    x: innerX,
    y: inY,
    size: 9,
    font: fontBody,
    color: cForest,
  })

  inY -= 17

  const displayUrl = cleanText(data.shortUrl || data.targetUrl.replace(/^https?:\/\//, ''))
  page.drawImage(iconExternalLink, {
    x: innerX,
    y: inY - 1,
    width: 10,
    height: 10,
  })
  page.drawText(displayUrl, {
    x: innerX + 14,
    y: inY,
    size: 10,
    font: fontMono,
    color: cOrange,
  })

  inY -= 18

  // Checkmarks with iconCheckCircle
  const checkmarks = [
    'Alle Details, Ablaufzeiten & Packliste online verfügbar',
    'Einfache Online-Anmeldung für dich und deine Eltern',
    'Verlässliche Betreuung: Jugend leitet Jugend',
  ]

  for (const cm of checkmarks) {
    page.drawImage(iconCheckCircle, {
      x: innerX,
      y: inY - 1,
      width: 9,
      height: 9,
    })
    page.drawText(cleanText(cm), {
      x: innerX + 14,
      y: inY,
      size: 8.5,
      font: fontBody,
      color: cForest,
    })
    inY -= 13
  }

  // Separator & Contact Info
  inY -= 4
  page.drawLine({
    start: { x: innerX, y: inY },
    end: { x: innerX + 340, y: inY },
    thickness: 0.5,
    color: cSand,
  })

  inY -= 11

  const rawName = (data.contact?.name || '').trim()
  const rawPhone = (data.contact?.phone || '').trim()
  const rawEmail = (data.contact?.email || '').trim()
  const hasPhone = rawPhone && rawPhone !== '-' && rawPhone.toLowerCase() !== 'null'
  const hasEmail = rawEmail && rawEmail !== '-' && rawEmail.toLowerCase() !== 'null'
  const hasName = rawName && rawName !== '-' && rawName.toLowerCase() !== 'null'

  if (hasName || hasPhone || hasEmail) {
    let curX = innerX
    const fragenText = 'FRAGEN?'
    page.drawText(fragenText, {
      x: curX,
      y: inY,
      size: 7.5,
      font: fontBold,
      color: cOrange,
    })
    curX += fontBold.widthOfTextAtSize(fragenText, 7.5) + 10

    if (hasName) {
      page.drawImage(iconUserCheck, {
        x: curX,
        y: inY - 1,
        width: 8.5,
        height: 8.5,
      })
      curX += 11
      const nameText = cleanText(rawName)
      page.drawText(nameText, {
        x: curX,
        y: inY,
        size: 7.5,
        font: fontBold,
        color: cForest,
      })
      curX += fontBold.widthOfTextAtSize(nameText, 7.5) + 12
    }

    if (hasPhone) {
      page.drawImage(iconPhone, {
        x: curX,
        y: inY - 1,
        width: 8.5,
        height: 8.5,
      })
      curX += 11
      const phoneText = cleanText(rawPhone)
      page.drawText(phoneText, {
        x: curX,
        y: inY,
        size: 7.5,
        font: fontBody,
        color: cForest,
      })
      curX += fontBody.widthOfTextAtSize(phoneText, 7.5) + 12
    }

    if (hasEmail) {
      page.drawImage(iconMail, {
        x: curX,
        y: inY - 1,
        width: 8.5,
        height: 8.5,
      })
      curX += 11
      const emailText = cleanText(rawEmail)
      page.drawText(emailText, {
        x: curX,
        y: inY,
        size: 7.5,
        font: fontBody,
        color: cForest,
      })
    }
  } else {
    page.drawText('FRAGEN?  SMJ Regio Wegweiser • kontakt@smj-wegweiser.de', {
      x: innerX,
      y: inY,
      size: 7.5,
      font: fontBody,
      color: cMuted,
    })
  }

  // Giant, High-Contrast QR Code on Right
  const qrSize = 100
  const qrX = W - marginX - qrSize - 22
  const qrY = regBoxY + (regBoxH - qrSize) / 2 + 10

  const qrBoxPad = 6
  page.drawRectangle({
    x: qrX - qrBoxPad,
    y: qrY - qrBoxPad,
    width: qrSize + 2 * qrBoxPad,
    height: qrSize + 2 * qrBoxPad,
    color: cWhite,
    borderColor: cForest,
    borderWidth: 2,
  })

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  })

  // Under QR Code: Two lines exactly matching web view!
  const qrCenterX = qrX + qrSize / 2

  // Line 1: HIER SCANNEN with up arrow icon
  const scanText = 'HIER SCANNEN'
  const scanSize = 7.5
  const scanTextW = fontBold.widthOfTextAtSize(scanText, scanSize)
  const arrowW = 7.5
  const scanGap = 3.5
  const line1TotalW = scanTextW + scanGap + arrowW
  const line1X = qrCenterX - line1TotalW / 2
  const line1Y = qrY - qrBoxPad - 13

  page.drawText(scanText, {
    x: line1X,
    y: line1Y,
    size: scanSize,
    font: fontBold,
    color: cForest,
  })

  page.drawImage(iconArrowUp, {
    x: line1X + scanTextW + scanGap,
    y: line1Y - 0.5,
    width: arrowW,
    height: arrowW,
  })

  // Line 2: DIREKT ZUR ANMELDUNG in orange
  const subText = 'DIREKT ZUR ANMELDUNG'
  const subSize = 6.5
  const subTextW = fontBold.widthOfTextAtSize(subText, subSize)
  const line2X = qrCenterX - subTextW / 2
  const line2Y = line1Y - 9.5

  page.drawText(subText, {
    x: line2X,
    y: line2Y,
    size: subSize,
    font: fontBold,
    color: cOrange,
  })

  // --- FOOTER NOTICE ---
  page.drawText(
    `SMJ Regio Wegweiser • Pater-Kentenich-Weg 3 • 37308 Heilbad Heiligenstadt`,
    {
      x: marginX,
      y: footerY,
      size: 6,
      font: fontMono,
      color: cMuted,
    },
  )

  const printNotice = `www.smj-wegweiser.de • Stand: ${new Date().getFullYear()}`
  page.drawText(printNotice, {
    x: W - marginX - fontMono.widthOfTextAtSize(printNotice, 6),
    y: footerY,
    size: 6,
    font: fontMono,
    color: cMuted,
  })

  return await doc.save()
}
