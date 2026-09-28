import QRCode from 'qrcode'
import type { ScheduleEventItem } from '../lib/pdf/schedule-pdf'

export interface ScheduleSlideOptions {
  format: 'post' | 'portrait' | 'story' // 1:1, 4:5, 9:16
  periodTitle: string
  periodSubtitle?: string
  slideIndex: number // 0, 1, 2...
  totalSlides: number
  events: ScheduleEventItem[]
  targetUrl: string
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
    .replace(/[★☆]/g, '*')
}

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
 * Renders a specific slide of a schedule carousel to an HTML5 canvas.
 */
export async function renderScheduleSlideToCanvas(
  canvas: HTMLCanvasElement,
  options: ScheduleSlideOptions,
): Promise<void> {
  let W = 1080
  let H = 1080
  if (options.format === 'portrait') H = 1350
  if (options.format === 'story') H = 1920

  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. Background
  ctx.fillStyle = '#111713'
  ctx.fillRect(0, 0, W, H)

  // Subtle expedition border
  ctx.strokeStyle = '#FF5A1F'
  ctx.lineWidth = 4
  ctx.strokeRect(36, 36, W - 72, H - 72)

  ctx.strokeStyle = '#232D25'
  ctx.lineWidth = 2
  ctx.strokeRect(48, 48, W - 96, H - 96)

  const marginX = 80
  const contentW = W - 2 * marginX
  let currY = 120

  // 2. Top Header (Logo + SMJ Claim)
  ctx.fillStyle = '#FF5A1F'
  ctx.font = 'bold 26px monospace'
  ctx.fillText('SMJ REGIO WEGWEISER', marginX, currY)

  // Slide Counter pill top right
  const slideText = `SLIDE ${options.slideIndex + 1} / ${options.totalSlides}`
  ctx.font = 'bold 22px monospace'
  const slideTextW = ctx.measureText(slideText).width
  ctx.fillStyle = '#1A231C'
  roundRect(ctx, W - marginX - slideTextW - 28, currY - 26, slideTextW + 28, 38, 4)
  ctx.fill()
  ctx.fillStyle = '#F1EBDD'
  ctx.fillText(slideText, W - marginX - slideTextW - 14, currY)

  currY += 28
  ctx.fillStyle = '#8D9389'
  ctx.font = '18px sans-serif'
  ctx.fillText('Katholische Schoenstatt-Mannesjugend', marginX, currY)

  currY += 32
  ctx.strokeStyle = '#2A362C'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(marginX, currY)
  ctx.lineTo(W - marginX, currY)
  ctx.stroke()

  currY += 50

  // Title & Period Headline
  ctx.fillStyle = '#FF5A1F'
  ctx.font = 'bold 24px monospace'
  ctx.fillText('// RAUS. INS ABENTEUER.', marginX, currY)

  currY += 46

  ctx.fillStyle = '#F1EBDD'
  ctx.font = '900 52px sans-serif'
  ctx.fillText(cleanText(options.periodTitle.toUpperCase()), marginX, currY)

  currY += 36

  if (options.periodSubtitle) {
    ctx.fillStyle = '#C9BA99'
    ctx.font = 'italic 26px sans-serif'
    ctx.fillText(cleanText(options.periodSubtitle), marginX, currY)
    currY += 40
  } else {
    currY += 20
  }

  // Divider
  ctx.strokeStyle = '#FF5A1F'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(marginX, currY)
  ctx.lineTo(marginX + 200, currY)
  ctx.stroke()

  currY += 50

  // 3. Render Events or Final CTA Slide
  const isFinalSlide = options.slideIndex === options.totalSlides - 1 && options.events.length === 0

  if (!isFinalSlide && options.events.length > 0) {
    // Render event cards on this slide
    const itemGap = options.format === 'story' ? 44 : 28
    const itemH = options.format === 'story' ? 160 : 130

    for (let i = 0; i < options.events.length; i++) {
      const ev = options.events[i]
      if (!ev) continue

      // Event Card Background
      ctx.fillStyle = '#182019'
      roundRect(ctx, marginX, currY, contentW, itemH, 6)
      ctx.fill()
      ctx.strokeStyle = '#273429'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Left orange accent strip
      ctx.fillStyle = '#FF5A1F'
      ctx.fillRect(marginX, currY, 8, itemH)

      // Date Tag
      ctx.fillStyle = '#FF5A1F'
      ctx.font = 'bold 22px monospace'
      ctx.fillText(cleanText(ev.dateStr.toUpperCase()), marginX + 28, currY + 38)

      // Event Title
      ctx.fillStyle = '#F1EBDD'
      ctx.font = 'bold 32px sans-serif'
      let evTitle = cleanText(ev.title)
      if (ctx.measureText(evTitle).width > contentW - 60) {
        while (ctx.measureText(evTitle + '...').width > contentW - 60 && evTitle.length > 5) {
          evTitle = evTitle.substring(0, evTitle.length - 1)
        }
        evTitle += '...'
      }
      ctx.fillText(evTitle, marginX + 28, currY + 78)

      // Location & Age info
      const meta = [ev.location, ev.ageGroup].filter(Boolean).join('  ·  ')
      ctx.fillStyle = '#8D9389'
      ctx.font = '20px sans-serif'
      ctx.fillText(cleanText(meta), marginX + 28, currY + 112)

      currY += itemH + itemGap
    }
  }

  // 4. Bottom Footer or Final Call-to-Action
  if (isFinalSlide || options.format === 'story' || (options.format === 'portrait' && options.events.length <= 3)) {
    // Final Call-to-Action Block with QR code
    const ctaY = H - (options.format === 'story' ? 440 : 360)
    ctx.fillStyle = '#F1EBDD'
    roundRect(ctx, marginX, ctaY, contentW, options.format === 'story' ? 320 : 250, 8)
    ctx.fill()

    // Generate QR
    try {
      const qrDataUrl = await QRCode.toDataURL(options.targetUrl, {
        margin: 1,
        width: 300,
        color: { dark: '#111713', light: '#FFFFFF' },
      })
      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise((res) => {
        qrImg.onload = res
      })

      const qrSize = options.format === 'story' ? 220 : 180
      ctx.drawImage(qrImg, W - marginX - qrSize - 30, ctaY + (options.format === 'story' ? 50 : 35), qrSize, qrSize)
    } catch {
      // ignore qr error
    }

    // Left CTA text inside white/paper card
    ctx.fillStyle = '#111713'
    ctx.font = '900 34px sans-serif'
    ctx.fillText('ALLE INFOS & ANMELDUNG', marginX + 35, ctaY + 65)

    ctx.fillStyle = '#FF5A1F'
    ctx.font = 'bold 26px monospace'
    ctx.fillText('smj-wegweiser.de/abenteuer/', marginX + 35, ctaY + 110)

    ctx.fillStyle = '#333F35'
    ctx.font = '20px sans-serif'
    ctx.fillText('Scanne den Code mit deinem Handy', marginX + 35, ctaY + 155)
    ctx.fillText('oder klicke auf den Link in unserer Bio!', marginX + 35, ctaY + 185)

    if (options.format === 'story') {
      ctx.fillStyle = '#FF5A1F'
      ctx.font = 'bold 20px monospace'
      ctx.fillText('📅 Kalender-Abo: smj-wegweiser.de/api/calendar.ics', marginX + 35, ctaY + 245)
    }
  }

  // Bottom brand stamp
  ctx.fillStyle = '#5A6357'
  ctx.font = '16px monospace'
  ctx.fillText(
    `SMJ REGIO WEGWEISER · JUGEND LEITET JUGEND · ${new Date().getFullYear()}`,
    marginX,
    H - 55,
  )
}

/**
 * Downloads a canvas as a PNG file.
 */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
