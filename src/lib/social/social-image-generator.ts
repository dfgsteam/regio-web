import sharp from 'sharp'
import QRCode from 'qrcode'
import type { ScheduleEventItem } from '../pdf/schedule-pdf'

async function generateQrInnerSvg(text: string): Promise<string> {
  const rawQr = await QRCode.toString(text, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#111713',
      light: '#ffffff',
    },
  })
  const match = rawQr.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  return match && match[1] ? match[1].trim() : ''
}

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return ''
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

export function splitFact(label: string, rawVal: string): [string, string] {
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
        return [p[0].trim(), `BEI ${p[1].trim()}`]
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
    if (u.includes('KOSTENLOS') || u.includes('FREI')) {
      return ['KOSTENLOS', 'FREIER EINTRITT']
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

const FACT_ICONS: Record<string, string> = {
  WANN: `<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="#FF5A1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  WO: `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="none" stroke="#FF5A1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" fill="none" stroke="#FF5A1F" stroke-width="2.5"/>`,
  WER: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none" stroke="#FF5A1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" fill="none" stroke="#FF5A1F" stroke-width="2.5"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="#FF5A1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="#FF5A1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  BEITRAG: `<rect width="20" height="12" x="2" y="6" rx="2" fill="none" stroke="#FF5A1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="none" stroke="#FF5A1F" stroke-width="2.5"/><path d="M6 12h.01M18 12h.01" fill="none" stroke="#FF5A1F" stroke-width="2.5" stroke-linecap="round"/>`,
}

export interface EventSocialOptions {
  format: 'story' | 'post' | 'portrait' // story: 1080x1920, post: 1080x1080, portrait: 1080x1350
  theme: 'dark' | 'light' | 'orange' | 'black'
  title: string
  subtitle?: string
  categoryLabel: string
  dateStr: string
  locationStr: string
  ageStr: string
  priceStr: string
  highlights?: string[]
  targetUrl: string
}

export interface ScheduleSlideSocialOptions {
  format: 'story' | 'post' // story: 1080x1920, post: 1080x1080
  theme: 'dark' | 'light'
  periodTitle: string
  periodSubtitle?: string
  slideIndex: number // 0, 1, 2
  totalSlides: number // 2 or 3
  events: ScheduleEventItem[]
  targetUrl: string
}

/**
 * Generates an SVG string for a single-event social media graphic.
 * Built for high impact & readability on mobile smartphone screens.
 */
export async function generateEventSocialSvg(options: EventSocialOptions): Promise<string> {
  const width = 1080
  const height = options.format === 'story' ? 1920 : options.format === 'portrait' ? 1350 : 1080
  const isLight = options.theme === 'light'
  const isOrange = options.theme === 'orange'
  const isBlack = options.theme === 'black'

  // Colors
  const bgColor = isLight ? '#F5EFE1' : isBlack ? '#050706' : isOrange ? '#1a0c07' : '#111713'
  const cardBg = isLight ? '#FFFFFF' : '#182019'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const textMuted = isLight ? '#4A524A' : '#C9BA99'

  // Fact cards: Solid dark forest cards (#111713) for high contrast and plakat feel
  const factCardBg = isLight ? '#111713' : isBlack ? '#090d0b' : isOrange ? '#1c0e09' : '#182019'
  const factCardStroke = isLight ? '#111713' : isBlack ? '#1e2420' : isOrange ? 'rgba(255,90,31,0.3)' : '#2D3B2F'
  const factCardH = options.format === 'story' ? 160 : options.format === 'portrait' ? 145 : 135

  // QR code
  let qrPaths = ''
  if (options.targetUrl) {
    try {
      qrPaths = await generateQrInnerSvg(options.targetUrl)
    } catch (e) {
      console.error('QR generation failed for social SVG', e)
    }
  }

  const highlights = options.highlights && options.highlights.length > 0
    ? options.highlights.slice(0, 3)
    : [
        'Lagerfeuer & Nachtspiele mitten in der Natur',
        'Große Geländespiele & spannende Abenteuer',
        '100% draußen, handyfrei & echte Gemeinschaft',
      ]

  const titleEsc = escapeXml(options.title)
  const subtitleEsc = escapeXml(options.subtitle || 'RAUS. INS ABENTEUER.')
  const catEsc = escapeXml(options.categoryLabel)

  // Dynamic eye-catching title size (scaled for high mobile impact)
  let titleFontSize = options.format === 'story' ? 96 : options.format === 'portrait' ? 84 : 76
  if (options.title.length > 28) titleFontSize -= 26
  else if (options.title.length > 20) titleFontSize -= 16
  else if (options.title.length > 14) titleFontSize -= 8

  let subFontSize = options.format === 'story' ? 36 : options.format === 'portrait' ? 32 : 28
  if (subtitleEsc.length > 40) subFontSize -= 6
  else if (subtitleEsc.length > 28) subFontSize -= 3

  const rawFacts = [
    { label: 'WANN', value: options.dateStr },
    { label: 'WO', value: options.locationStr },
    { label: 'WER', value: options.ageStr },
    { label: 'BEITRAG', value: options.priceStr },
  ]

  const factsSvg = rawFacts.map((f, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cardX = col * 458
    const cardY = row * (factCardH + (options.format === 'story' ? 20 : 15))
    const [line1, line2] = splitFact(f.label, f.value)
    const iconSvg = FACT_ICONS[f.label] || ''

    // Much larger typography for smartphone screens
    let l1Size = options.format === 'story' ? 36 : options.format === 'portrait' ? 34 : 32
    if (line1.length > 16) l1Size -= 8
    else if (line1.length > 12) l1Size -= 4

    let l2Size = options.format === 'story' ? 22 : options.format === 'portrait' ? 20 : 19
    if (line2.length > 18) l2Size -= 3

    return `
      <!-- ${f.label} -->
      <g transform="translate(${cardX}, ${cardY})">
        <rect x="0" y="0" width="430" height="${factCardH}" fill="${factCardBg}" stroke="${factCardStroke}" stroke-width="2" rx="8"/>
        <rect x="0" y="0" width="10" height="${factCardH}" fill="#FF5A1F" rx="3"/>
        <svg x="24" y="16" width="24" height="24" viewBox="0 0 24 24">
          ${iconSvg}
        </svg>
        <text x="56" y="34" fill="#FF5A1F" font-size="18" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" letter-spacing="2">${f.label}</text>
        <text x="24" y="${options.format === 'story' ? 88 : options.format === 'portrait' ? 82 : 78}" fill="#F1EBDD" font-size="${l1Size}" font-family="sans-serif" font-weight="bold">${escapeXml(line1)}</text>
        ${line2 ? `<text x="24" y="${options.format === 'story' ? 128 : options.format === 'portrait' ? 118 : 112}" fill="#C9BA99" font-size="${l2Size}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold">${escapeXml(line2)}</text>` : ''}
      </g>
    `
  }).join('')

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isLight ? '#F5EFE1' : isBlack ? '#000000' : isOrange ? '#241008' : '#182019'}"/>
        <stop offset="50%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="${isLight ? '#EAE2D0' : '#0a0d0b'}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bgGrad)"/>
    
    <!-- Outer Framing Border -->
    ${
      isLight
        ? `
    <!-- Crisp Double Expedition Border in Light Mode -->
    <rect x="44" y="44" width="${width - 88}" height="${height - 88}" fill="none" stroke="#111713" stroke-width="2.5"/>
    <rect x="52" y="52" width="${width - 104}" height="${height - 104}" fill="none" stroke="#C9BA99" stroke-width="1" stroke-dasharray="8,6"/>
    `
        : `
    <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="#F1EBDD" stroke-width="2" stroke-opacity="0.25"/>
    `
    }
    
    <!-- Corner Brackets in Signal Orange -->
    <path d="M 45 80 L 45 45 L 80 45" fill="none" stroke="#FF5A1F" stroke-width="6"/>
    <path d="M ${width - 80} 45 L ${width - 45} 45 L ${width - 45} 80" fill="none" stroke="#FF5A1F" stroke-width="6"/>
    <path d="M 45 ${height - 80} L 45 ${height - 45} L 80 ${height - 45}" fill="none" stroke="#FF5A1F" stroke-width="6"/>
    <path d="M ${width - 80} ${height - 45} L ${width - 45} ${height - 45} L ${width - 45} ${height - 80}" fill="none" stroke="#FF5A1F" stroke-width="6"/>

    <!-- Header Bar -->
    <g transform="translate(96, ${options.format === 'story' ? 200 : options.format === 'portrait' ? 105 : 95})">
      <text x="0" y="0" fill="#FF5A1F" font-size="24" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" letter-spacing="3">SMJ REGIO WEGWEISER</text>
      <rect x="${width - 192 - 180}" y="-26" width="180" height="38" fill="${isLight ? '#111713' : '#FF5A1F'}" rx="4"/>
      <text x="${width - 192 - 90}" y="-1" fill="${isLight ? '#F1EBDD' : '#111713'}" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">${catEsc}</text>
    </g>

    <!-- Main Title Block (Dominant Eye-Catcher) -->
    <g transform="translate(96, ${options.format === 'story' ? 300 : options.format === 'portrait' ? 185 : 165})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 28 : 26}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" letter-spacing="2">// RAUS. INS ABENTEUER.</text>
      <text x="0" y="${options.format === 'story' ? 84 : options.format === 'portrait' ? 72 : 68}" fill="${textPrimary}" font-size="${titleFontSize}" font-family="sans-serif" font-weight="bold">${titleEsc}</text>
      <text x="0" y="${options.format === 'story' ? 148 : options.format === 'portrait' ? 126 : 120}" fill="#FF5A1F" font-size="${subFontSize}" font-family="sans-serif" font-weight="bold">// ${subtitleEsc}</text>
    </g>

    <!-- Key Facts Grid (Large Bold Facts matching Plakat) -->
    <g transform="translate(96, ${options.format === 'story' ? 510 : options.format === 'portrait' ? 360 : 330})">
      ${factsSvg}
    </g>

    ${
      options.format !== 'post'
        ? `
    <!-- Highlights (Shown on Story and Portrait) -->
    <g transform="translate(96, ${options.format === 'story' ? 900 : 700})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 24 : 22}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" letter-spacing="2">// HIGHLIGHTS &amp; PROGRAMM</text>
      
      ${highlights
        .map(
          (h, i) => `
        <g transform="translate(0, ${22 + i * (options.format === 'story' ? 116 : 92)})">
          <rect x="0" y="0" width="888" height="${options.format === 'story' ? 100 : 80}" fill="${isLight ? '#FFFFFF' : '#182019'}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="${isLight ? '2.5' : '1.5'}" stroke-opacity="${isLight ? '1' : '0.2'}" rx="8"/>
          <text x="28" y="${options.format === 'story' ? 62 : 50}" fill="#FF5A1F" font-size="${options.format === 'story' ? 32 : 28}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold">0${i + 1}</text>
          <text x="88" y="${options.format === 'story' ? 60 : 49}" fill="${textPrimary}" font-size="${options.format === 'story' ? 26 : 23}" font-family="sans-serif" font-weight="bold">${escapeXml(h)}</text>
        </g>
      `,
        )
        .join('')}
    </g>
    `
        : ''
    }

    <!-- Bottom Action CTA Box (Big, Bold, Unmissable) -->
    <g transform="translate(96, ${options.format === 'story' ? 1300 : options.format === 'portrait' ? 1010 : 650})">
      <rect x="0" y="0" width="888" height="${options.format === 'story' ? 330 : options.format === 'portrait' ? 240 : 290}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#FF5A1F'}" stroke-width="3" rx="10"/>
      
      <rect x="28" y="24" width="220" height="38" fill="#FF5A1F" rx="4"/>
      <text x="138" y="49" fill="#111713" font-size="18" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" text-anchor="middle">JETZT ANMELDEN</text>
      
      <text x="28" y="${options.format === 'story' ? 122 : options.format === 'portrait' ? 104 : 118}" fill="${textPrimary}" font-size="${options.format === 'story' ? 42 : options.format === 'portrait' ? 34 : 38}" font-family="sans-serif" font-weight="bold">Plätze online sichern:</text>
      <text x="28" y="${options.format === 'story' ? 182 : options.format === 'portrait' ? 154 : 172}" fill="#FF5A1F" font-size="${options.format === 'story' ? 50 : options.format === 'portrait' ? 42 : 44}" font-family="sans-serif" font-weight="bold">smj-wegweiser.de</text>
      
      <text x="28" y="${options.format === 'story' ? 242 : options.format === 'portrait' ? 198 : 226}" fill="${isLight ? '#3D453E' : textMuted}" font-size="${options.format === 'story' ? 24 : 21}" font-family="sans-serif" font-weight="600">Link in Bio anklicken &#8226; Alle Infos &amp; Packliste online!</text>

      ${
        qrPaths && options.format !== 'portrait'
          ? `
      <g transform="translate(${888 - 28 - (options.format === 'story' ? 200 : 190)}, ${options.format === 'story' ? 55 : 42})">
        <rect x="0" y="0" width="${options.format === 'story' ? 200 : 190}" height="${options.format === 'story' ? 200 : 190}" fill="#ffffff" stroke="${isLight ? '#111713' : 'none'}" stroke-width="${isLight ? '2' : '0'}" rx="6"/>
        <svg x="10" y="10" width="${options.format === 'story' ? 180 : 170}" height="${options.format === 'story' ? 180 : 170}" viewBox="0 0 33 33" shape-rendering="crispEdges">
          ${qrPaths}
        </svg>
      </g>
      `
          : ''
      }
    </g>

    <!-- Footer Copyright Note -->
    <text x="${width / 2}" y="${height - (options.format === 'story' ? 160 : 45)}" fill="${textPrimary}" fill-opacity="${isLight ? '0.85' : '0.5'}" font-size="18" font-family="'Space Mono', monospace, sans-serif" text-anchor="middle">SMJ Regio Wegweiser &#8226; Schönstatt-Mannesjugend &#8226; smj-wegweiser.de</text>
  </svg>`
}

/**
 * Generates an SVG string for a multi-slide schedule carousel.
 * Bold, high-contrast, optimized for phone screens.
 */
export async function generateScheduleSlideSvg(options: ScheduleSlideSocialOptions): Promise<string> {
  const width = 1080
  const height = options.format === 'story' ? 1920 : 1080
  const isLight = options.theme === 'light'

  const bgColor = isLight ? '#F5EFE1' : '#111713'
  const cardBg = isLight ? '#FFFFFF' : '#182019'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const textMuted = isLight ? '#4A524A' : '#C9BA99'

  let qrPaths = ''
  if (options.targetUrl) {
    try {
      qrPaths = await generateQrInnerSvg(options.targetUrl)
    } catch (e) {
      console.error('QR generation failed for slide SVG', e)
    }
  }

  const isLastSlide = options.slideIndex === options.totalSlides - 1
  const eventsCount = options.events.length

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="slideBgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isLight ? '#F5EFE1' : '#182019'}"/>
        <stop offset="50%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="${isLight ? '#EAE2D0' : '#0a0d0b'}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#slideBgGrad)"/>
    
    <!-- Outer Framing Border -->
    ${
      isLight
        ? `
    <rect x="44" y="44" width="${width - 88}" height="${height - 88}" fill="none" stroke="#111713" stroke-width="2.5"/>
    <rect x="52" y="52" width="${width - 104}" height="${height - 104}" fill="none" stroke="#C9BA99" stroke-width="1" stroke-dasharray="8,6"/>
    `
        : `
    <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="#F1EBDD" stroke-width="2" stroke-opacity="0.25"/>
    `
    }
    
    <!-- Corner Brackets -->
    <path d="M 45 80 L 45 45 L 80 45" fill="none" stroke="#FF5A1F" stroke-width="6"/>
    <path d="M ${width - 80} 45 L ${width - 45} 45 L ${width - 45} 80" fill="none" stroke="#FF5A1F" stroke-width="6"/>
    <path d="M 45 ${height - 80} L 45 ${height - 45} L 80 ${height - 45}" fill="none" stroke="#FF5A1F" stroke-width="6"/>
    <path d="M ${width - 80} ${height - 45} L ${width - 45} ${height - 45} L ${width - 45} ${height - 80}" fill="none" stroke="#FF5A1F" stroke-width="6"/>

    <!-- Header Bar -->
    <g transform="translate(96, ${options.format === 'story' ? 200 : 95})">
      <text x="0" y="0" fill="#FF5A1F" font-size="24" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" letter-spacing="3">SMJ REGIO WEGWEISER</text>
      <rect x="${width - 192 - 180}" y="-26" width="180" height="38" fill="${isLight ? '#111713' : '#FF5A1F'}" rx="4"/>
      <text x="${width - 192 - 90}" y="-1" fill="${isLight ? '#F1EBDD' : '#111713'}" font-size="18" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" text-anchor="middle">TEIL ${options.slideIndex + 1} / ${options.totalSlides}</text>
    </g>

    ${
      !isLastSlide
        ? `
    <!-- Title Section -->
    <g transform="translate(96, ${options.format === 'story' ? 300 : 175})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 28 : 24}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" letter-spacing="2">// TERMINE &amp; AKTIONEN</text>
      <text x="0" y="${options.format === 'story' ? 76 : 64}" fill="${textPrimary}" font-size="${options.format === 'story' ? 74 : 62}" font-family="sans-serif" font-weight="bold">${escapeXml(options.periodTitle)}</text>
      <text x="0" y="${options.format === 'story' ? 132 : 112}" fill="#FF5A1F" font-size="${options.format === 'story' ? 32 : 28}" font-family="sans-serif" font-weight="bold">// ${escapeXml(options.periodSubtitle || 'ALLE AKTIONEN IM ÜBERBLICK')}</text>
    </g>

    <!-- Events Cards List (Huge Bold Cards for Mobile Readability) -->
    <g transform="translate(96, ${options.format === 'story' ? 480 : 320})">
      ${options.events
        .map((ev, i) => {
          const itemH =
            options.format === 'story'
              ? eventsCount <= 2 ? 340 : eventsCount === 3 ? 260 : 210
              : eventsCount <= 2 ? 210 : eventsCount === 3 ? 165 : 130
          const gap = options.format === 'story' ? 24 : 16
          const yPos = i * (itemH + gap)

          const dateSize = options.format === 'story' ? 30 : eventsCount <= 2 ? 26 : 24
          const titleSize = options.format === 'story' ? 42 : eventsCount <= 2 ? 38 : eventsCount === 3 ? 32 : 28
          const locSize = options.format === 'story' ? 26 : eventsCount <= 2 ? 24 : eventsCount === 3 ? 21 : 19

          return `
          <g transform="translate(0, ${yPos})">
            <rect x="0" y="0" width="888" height="${itemH}" fill="${isLight ? '#111713' : '#182019'}" stroke="${isLight ? '#111713' : '#2D3B2F'}" stroke-width="2" rx="8"/>
            <rect x="0" y="0" width="10" height="${itemH}" fill="#FF5A1F" rx="3"/>
            <text x="32" y="${options.format === 'story' ? 56 : eventsCount <= 2 ? 48 : 42}" fill="#FF5A1F" font-size="${dateSize}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold">${escapeXml(ev.dateStr)}</text>
            <text x="32" y="${options.format === 'story' ? 120 : eventsCount <= 2 ? 104 : 90}" fill="#F1EBDD" font-size="${titleSize}" font-family="sans-serif" font-weight="bold">${escapeXml(ev.title)}</text>
            <text x="32" y="${options.format === 'story' ? 175 : eventsCount <= 2 ? 155 : 132}" fill="#C9BA99" font-size="${locSize}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold">${escapeXml([ev.location, ev.ageGroup].filter(Boolean).join(' • '))}</text>
          </g>
        `
        })
        .join('')}
    </g>
    `
        : `
    <!-- Final CTA Slide: Registration & Highlights -->
    <g transform="translate(96, ${options.format === 'story' ? 300 : 175})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 28 : 24}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" letter-spacing="2">// JETZT ANMELDEN</text>
      <text x="0" y="${options.format === 'story' ? 76 : 64}" fill="${textPrimary}" font-size="${options.format === 'story' ? 76 : 64}" font-family="sans-serif" font-weight="bold">ALLE INFOS ONLINE</text>
      <text x="0" y="${options.format === 'story' ? 134 : 112}" fill="#FF5A1F" font-size="${options.format === 'story' ? 34 : 28}" font-family="sans-serif" font-weight="bold">// PLÄTZE SICHERN &amp; KALENDER ABONNIEREN</text>
    </g>

    <!-- 3 Highlight Feature Cards -->
    <g transform="translate(96, ${options.format === 'story' ? 490 : 330})">
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="888" height="${options.format === 'story' ? 115 : 84}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="${isLight ? '2.5' : '1.5'}" stroke-opacity="${isLight ? '1' : '0.2'}" rx="8"/>
        <text x="28" y="${options.format === 'story' ? 70 : 52}" fill="#FF5A1F" font-size="${options.format === 'story' ? 34 : 28}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold">01</text>
        <text x="96" y="${options.format === 'story' ? 68 : 50}" fill="${textPrimary}" font-size="${options.format === 'story' ? 28 : 24}" font-family="sans-serif" font-weight="bold">ECHTE NATUR &amp; LAGERFEUER</text>
      </g>
      <g transform="translate(0, ${options.format === 'story' ? 135 : 100})">
        <rect x="0" y="0" width="888" height="${options.format === 'story' ? 115 : 84}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="${isLight ? '2.5' : '1.5'}" stroke-opacity="${isLight ? '1' : '0.2'}" rx="8"/>
        <text x="28" y="${options.format === 'story' ? 70 : 52}" fill="#FF5A1F" font-size="${options.format === 'story' ? 34 : 28}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold">02</text>
        <text x="96" y="${options.format === 'story' ? 68 : 50}" fill="${textPrimary}" font-size="${options.format === 'story' ? 28 : 24}" font-family="sans-serif" font-weight="bold">JUNGS VON 9 BIS 14 JAHREN</text>
      </g>
      <g transform="translate(0, ${options.format === 'story' ? 270 : 200})">
        <rect x="0" y="0" width="888" height="${options.format === 'story' ? 115 : 84}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="${isLight ? '2.5' : '1.5'}" stroke-opacity="${isLight ? '1' : '0.2'}" rx="8"/>
        <text x="28" y="${options.format === 'story' ? 70 : 52}" fill="#FF5A1F" font-size="${options.format === 'story' ? 34 : 28}" font-family="'Space Mono', monospace, sans-serif" font-weight="bold">03</text>
        <text x="96" y="${options.format === 'story' ? 68 : 50}" fill="${textPrimary}" font-size="${options.format === 'story' ? 28 : 24}" font-family="sans-serif" font-weight="bold">JUGEND LEITET JUGEND &#8226; 100% DRAUSSEN</text>
      </g>
    </g>

    <!-- Large Action Box -->
    <g transform="translate(96, ${options.format === 'story' ? 950 : 640})">
      <rect x="0" y="0" width="888" height="${options.format === 'story' ? 400 : 295}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#FF5A1F'}" stroke-width="3" rx="10"/>
      
      <rect x="28" y="26" width="240" height="40" fill="#FF5A1F" rx="4"/>
      <text x="148" y="52" fill="#111713" font-size="18" font-family="'Space Mono', monospace, sans-serif" font-weight="bold" text-anchor="middle">ONLINE ANMELDEN</text>

      <text x="28" y="${options.format === 'story' ? 135 : 118}" fill="${textPrimary}" font-size="${options.format === 'story' ? 44 : 36}" font-family="sans-serif" font-weight="bold">Alle Aktionen &amp; Termine:</text>
      <text x="28" y="${options.format === 'story' ? 198 : 172}" fill="#FF5A1F" font-size="${options.format === 'story' ? 50 : 44}" font-family="sans-serif" font-weight="bold">smj-wegweiser.de/abenteuer/</text>
      <text x="28" y="${options.format === 'story' ? 258 : 222}" fill="${isLight ? '#3D453E' : textMuted}" font-size="${options.format === 'story' ? 24 : 20}" font-family="sans-serif" font-weight="600">Kalender als iCal / Google abonnieren: /api/calendar.ics</text>

      ${
        qrPaths
          ? `
      <g transform="translate(${888 - 28 - (options.format === 'story' ? 220 : 190)}, ${options.format === 'story' ? 80 : 45})">
        <rect x="0" y="0" width="${options.format === 'story' ? 220 : 190}" height="${options.format === 'story' ? 220 : 190}" fill="#ffffff" stroke="${isLight ? '#111713' : 'none'}" stroke-width="${isLight ? '2' : '0'}" rx="6"/>
        <svg x="12" y="12" width="${options.format === 'story' ? 196 : 166}" height="${options.format === 'story' ? 196 : 166}" viewBox="0 0 33 33" shape-rendering="crispEdges">
          ${qrPaths}
        </svg>
      </g>
      `
          : ''
      }
    </g>
    `
    }

    <!-- Footer Copyright -->
    <text x="${width / 2}" y="${height - (options.format === 'story' ? 160 : 45)}" fill="${textPrimary}" fill-opacity="${isLight ? '0.85' : '0.5'}" font-size="18" font-family="'Space Mono', monospace, sans-serif" text-anchor="middle">SMJ Regio Wegweiser &#8226; Schönstatt-Mannesjugend &#8226; smj-wegweiser.de</text>
  </svg>`
}

/**
 * Converts an SVG string to a high-resolution PNG Buffer using sharp.
 */
export async function renderSvgToPng(svgString: string): Promise<Buffer> {
  return await sharp(Buffer.from(svgString)).png({ compressionLevel: 8 }).toBuffer()
}
