import QRCode from 'qrcode'

export interface SocialRenderOptions {
  format: 'story' | 'post' | 'portrait' // 9:16 (1080x1920), 1:1 (1080x1080), 4:5 (1080x1350)
  theme?: 'dark' | 'orange' | 'black'
  title: string
  subtitle?: string
  categoryLabel: string
  dateStr: string
  locationStr: string
  ageStr: string
  priceStr: string
  highlights?: string[]
  targetUrl: string
  showQr?: boolean
  showStickerBox?: boolean
}

/**
 * Helper to wrap text into lines fitting max width
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

/**
 * Helper to load an image from URL as HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src
  })
}

/**
 * Helper to draw a rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Renders high-resolution social graphic on HTML5 Canvas.
 */
export async function renderSocialToCanvas(
  canvas: HTMLCanvasElement,
  options: SocialRenderOptions,
): Promise<void> {
  const isStory = options.format === 'story'
  const isPortrait = options.format === 'portrait'

  const width = 1080
  const height = isStory ? 1920 : isPortrait ? 1350 : 1080

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Ensure custom web fonts are loaded
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await (document as any).fonts.ready
    } catch {
      // fallback
    }
  }

  // 1. Background Fill
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
  if (options.theme === 'orange') {
    bgGrad.addColorStop(0, '#1a0c07')
    bgGrad.addColorStop(0.5, '#111713')
    bgGrad.addColorStop(1, '#0b0f0c')
  } else if (options.theme === 'black') {
    bgGrad.addColorStop(0, '#000000')
    bgGrad.addColorStop(1, '#0a0d0b')
  } else {
    // Standard Dark Forest
    bgGrad.addColorStop(0, '#182019')
    bgGrad.addColorStop(0.4, '#111713')
    bgGrad.addColorStop(1, '#0c100d')
  }
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Decorative Border & Framing
  const margin = 48
  ctx.strokeStyle = '#F1EBDD'
  ctx.globalAlpha = 0.15
  ctx.lineWidth = 3
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2)

  // Corner Accent Marks
  ctx.globalAlpha = 0.9
  ctx.strokeStyle = '#FF5A1F'
  ctx.lineWidth = 6
  const cLen = 32

  // Top-left
  ctx.beginPath()
  ctx.moveTo(margin - 3, margin + cLen)
  ctx.lineTo(margin - 3, margin - 3)
  ctx.lineTo(margin + cLen, margin - 3)
  ctx.stroke()

  // Top-right
  ctx.beginPath()
  ctx.moveTo(width - margin + 3 - cLen, margin - 3)
  ctx.lineTo(width - margin + 3, margin - 3)
  ctx.lineTo(width - margin + 3, margin + cLen)
  ctx.stroke()

  // Bottom-left
  ctx.beginPath()
  ctx.moveTo(margin - 3, height - margin - cLen)
  ctx.lineTo(margin - 3, height - margin + 3)
  ctx.lineTo(margin + cLen, height - margin + 3)
  ctx.stroke()

  // Bottom-right
  ctx.beginPath()
  ctx.moveTo(width - margin + 3 - cLen, height - margin + 3)
  ctx.lineTo(width - margin + 3, height - margin + 3)
  ctx.lineTo(width - margin + 3, height - margin - cLen)
  ctx.stroke()

  ctx.globalAlpha = 1.0

  // 3. Header: Logo & Branding
  let currentY = margin + 44

  try {
    const logoImg = await loadImage('/logo_wegweiser_white.svg')
    const logoSize = isStory ? 76 : 64
    ctx.drawImage(logoImg, margin + 24, currentY, logoSize, (logoSize * 288) / 328)

    // Org Name text
    ctx.fillStyle = '#FF5A1F'
    ctx.font = `bold ${isStory ? 20 : 18}px "Space Mono", monospace`
    ctx.fillText('SCHÖNSTATT-MANNESJUGEND', margin + 24 + logoSize + 20, currentY + 28)

    ctx.fillStyle = '#F1EBDD'
    ctx.font = `bold ${isStory ? 28 : 24}px Anton, sans-serif`
    ctx.fillText('REGIO WEGWEISER', margin + 24 + logoSize + 20, currentY + 58)
  } catch {
    // Fallback text if logo fails to load
    ctx.fillStyle = '#FF5A1F'
    ctx.font = 'bold 24px "Space Mono", monospace'
    ctx.fillText('SMJ REGIO WEGWEISER', margin + 24, currentY + 40)
  }

  // Category Badge (Top Right)
  const badgeText = options.categoryLabel.toUpperCase()
  ctx.font = `bold ${isStory ? 20 : 18}px "Space Mono", monospace`
  const badgeMetrics = ctx.measureText(badgeText)
  const badgePadX = 24
  const badgeW = badgeMetrics.width + badgePadX * 2
  const badgeH = 44
  const badgeX = width - margin - 24 - badgeW
  const badgeY = currentY + 12

  ctx.fillStyle = '#FF5A1F'
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6)
  ctx.fill()

  ctx.fillStyle = '#111713'
  ctx.fillText(badgeText, badgeX + badgePadX, badgeY + 29)

  currentY += isStory ? 160 : 120

  // 4. Main Event Title (Anton Font)
  const titleFontSize = isStory ? 86 : isPortrait ? 72 : 64
  ctx.font = `bold ${titleFontSize}px Anton, sans-serif`
  ctx.fillStyle = '#F1EBDD'

  const maxContentW = width - (margin + 24) * 2
  const titleLines = wrapText(ctx, options.title.toUpperCase(), maxContentW)

  for (const line of titleLines) {
    ctx.fillText(line, margin + 24, currentY)
    currentY += titleFontSize * 1.05
  }

  // Subtitle / Motto
  if (options.subtitle) {
    currentY += 12
    ctx.fillStyle = '#FF5A1F'
    ctx.font = `italic bold ${isStory ? 38 : 30}px Caveat, cursive, sans-serif`
    const subLines = wrapText(ctx, `// ${options.subtitle}`, maxContentW)
    for (const sLine of subLines) {
      ctx.fillText(sLine, margin + 24, currentY)
      currentY += isStory ? 44 : 36
    }
  }

  currentY += isStory ? 36 : 24

  // 5. Four Key Fact Boxes (2x2 Grid)
  const gridW = maxContentW
  const colGap = 20
  const rowGap = isStory ? 20 : 16
  const boxW = (gridW - colGap) / 2
  const boxH = isStory ? 140 : 112

  const facts = [
    { label: 'WANN?', val: options.dateStr, icon: '📅' },
    { label: 'WO?', val: options.locationStr, icon: '📍' },
    { label: 'WER?', val: options.ageStr, icon: '👥' },
    { label: 'BEITRAG', val: options.priceStr, icon: '💰' },
  ]

  facts.forEach((fact, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const bx = margin + 24 + col * (boxW + colGap)
    const by = currentY + row * (boxH + rowGap)

    // Box Background
    ctx.fillStyle = '#182019'
    roundRect(ctx, bx, by, boxW, boxH, 8)
    ctx.fill()

    ctx.strokeStyle = 'rgba(241, 235, 221, 0.2)'
    ctx.lineWidth = 2
    roundRect(ctx, bx, by, boxW, boxH, 8)
    ctx.stroke()

    // Left accent bar
    ctx.fillStyle = '#FF5A1F'
    roundRect(ctx, bx, by, 8, boxH, 4)
    ctx.fill()

    // Fact Label
    ctx.fillStyle = '#FF5A1F'
    ctx.font = `bold ${isStory ? 18 : 16}px "Space Mono", monospace`
    ctx.fillText(`${fact.icon} ${fact.label}`, bx + 22, by + (isStory ? 36 : 30))

    // Fact Value (with wrapping if long)
    ctx.fillStyle = '#F1EBDD'
    ctx.font = `bold ${isStory ? 24 : 20}px "Inter Variable", sans-serif`
    const valLines = wrapText(ctx, fact.val, boxW - 36)
    let valY = by + (isStory ? 74 : 64)
    for (const vLine of valLines.slice(0, 2)) {
      ctx.fillText(vLine, bx + 22, valY)
      valY += isStory ? 30 : 24
    }
  })

  currentY += boxH * 2 + rowGap + (isStory ? 48 : 28)

  // 6. Highlights (if story or portrait)
  if ((isStory || isPortrait) && options.highlights && options.highlights.length > 0) {
    ctx.fillStyle = 'rgba(24, 32, 25, 0.7)'
    const hlH = isStory ? 150 : 110
    roundRect(ctx, margin + 24, currentY, maxContentW, hlH, 8)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 90, 31, 0.3)'
    ctx.lineWidth = 2
    roundRect(ctx, margin + 24, currentY, maxContentW, hlH, 8)
    ctx.stroke()

    ctx.fillStyle = '#FF5A1F'
    ctx.font = `bold ${isStory ? 18 : 16}px "Space Mono", monospace`
    ctx.fillText('⚡ WAS ERWARTET DICH?', margin + 44, currentY + 32)

    ctx.fillStyle = '#F1EBDD'
    ctx.font = `${isStory ? 20 : 17}px "Inter Variable", sans-serif`
    const hlText = options.highlights.slice(0, 3).join('   ·   ')
    const hlLines = wrapText(ctx, hlText, maxContentW - 40)
    let hly = currentY + (isStory ? 70 : 62)
    for (const hLine of hlLines.slice(0, 2)) {
      ctx.fillText(hLine, margin + 44, hly)
      hly += 28
    }

    currentY += hlH + (isStory ? 44 : 24)
  }

  // 7. Action / Sticker / QR Section
  const bottomZoneH = isStory ? 320 : isPortrait ? 200 : 170
  const bottomZoneY = height - margin - bottomZoneH - 24

  if (isStory && options.showStickerBox) {
    // Sticker Placeholder Box for Instagram Story
    ctx.setLineDash([12, 8])
    ctx.strokeStyle = '#FF5A1F'
    ctx.lineWidth = 3
    ctx.fillStyle = 'rgba(255, 90, 31, 0.08)'
    roundRect(ctx, margin + 24, bottomZoneY, maxContentW, 140, 16)
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#FF5A1F'
    ctx.font = 'bold 28px Anton, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🔗 HIER LINK-STICKER PLATZIEREN', width / 2, bottomZoneY + 60)

    ctx.fillStyle = '#F1EBDD'
    ctx.font = 'bold 20px "Space Mono", monospace'
    const shortLink = options.targetUrl.replace(/^https?:\/\//, '')
    ctx.fillText(shortLink, width / 2, bottomZoneY + 98)
    ctx.textAlign = 'left'
  } else if (options.showQr) {
    // Draw QR Code
    try {
      const qrDataUrl = await QRCode.toDataURL(options.targetUrl, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#111713', light: '#ffffff' },
      })
      const qrImg = await loadImage(qrDataUrl)
      const qrSize = isStory ? 160 : 130
      const qrX = width - margin - 24 - qrSize
      const qrY = bottomZoneY + (bottomZoneH - qrSize) / 2

      // White Card for QR
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 8)
      ctx.fill()
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      // CTA Text next to QR
      ctx.fillStyle = '#FF5A1F'
      ctx.font = `bold ${isStory ? 28 : 22}px Anton, sans-serif`
      ctx.fillText('JETZT ONLINE ANMELDEN!', margin + 24, qrY + 40)

      ctx.fillStyle = '#F1EBDD'
      ctx.font = `${isStory ? 20 : 16}px "Space Mono", monospace`
      ctx.fillText('QR-Code scannen oder Link öffnen:', margin + 24, qrY + 76)

      ctx.fillStyle = '#FF5A1F'
      ctx.font = `bold ${isStory ? 22 : 18}px "Space Mono", monospace`
      ctx.fillText(options.targetUrl.replace(/^https?:\/\//, ''), margin + 24, qrY + 110)
    } catch (e) {
      console.error('QR draw error', e)
    }
  } else {
    // Normal CTA Banner
    ctx.fillStyle = '#FF5A1F'
    roundRect(ctx, margin + 24, bottomZoneY + 20, maxContentW, isStory ? 120 : 90, 10)
    ctx.fill()

    ctx.fillStyle = '#111713'
    ctx.textAlign = 'center'
    ctx.font = `bold ${isStory ? 38 : 28}px Anton, sans-serif`
    ctx.fillText('JETZT ANMELDEN · LINK IN DER BIO 👆', width / 2, bottomZoneY + (isStory ? 74 : 56))

    ctx.fillStyle = '#111713'
    ctx.font = `bold ${isStory ? 20 : 16}px "Space Mono", monospace`
    ctx.fillText('smj-wegweiser.de/abenteuer', width / 2, bottomZoneY + (isStory ? 104 : 80))
    ctx.textAlign = 'left'
  }

  // 8. Footer Motto & Legal
  ctx.fillStyle = 'rgba(241, 235, 221, 0.5)'
  ctx.font = 'bold 16px "Space Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('RAUS. INS ABENTEUER.  ·  SMJ-WEGWEISER.DE', width / 2, height - margin - 12)
  ctx.textAlign = 'left'
}

/**
 * Downloads rendered canvas as PNG
 */
export async function downloadSocialCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  const cleanName = filename.endsWith('.png') ? filename : `${filename}.png`
  const dataUrl = canvas.toDataURL('image/png', 1.0)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = cleanName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
