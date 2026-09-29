import sharp from 'sharp'
import type { ScheduleEventItem } from '../pdf/schedule-pdf'

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
    let s = u
      .replace(/JANUAR/g, 'JAN.')
      .replace(/FEBRUAR/g, 'FEB.')
      .replace(/MÄRZ/g, 'MÄRZ')
      .replace(/APRIL/g, 'APRIL')
      .replace(/JULI/g, 'JULI')
      .replace(/OKTOBER/g, 'OKT.')
    const m = s.match(/^([0-9.\s-]+[A-ZÄÖÜ.]+)\s+([0-9]{4})$/)
    if (m && m[1] && m[2]) return [m[1].trim(), m[2].trim()]
    const parts = s.split(/\s+/)
    if (parts.length >= 3) {
      return [parts.slice(0, parts.length - 1).join(' '), parts.slice(-1).join(' ')]
    }
    return [s, '']
  }

  if (label === 'WO') {
    if (u.includes(',')) {
      const p = u.split(',')
      if (p[0] && p[1]) {
        return [p[0].trim(), p[1].trim()]
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

function parseTitleAndSubtitle(title: string, rawSubtitle?: string, location?: string): {
  mainTitle: string
  subTitle: string
} {
  let main = title.trim().toUpperCase().replace(/[–—]/g, '-')
  let sub = (rawSubtitle || '').trim().replace(/[–—]/g, '-')

  if (main.includes(' - ')) {
    const parts = main.split(' - ')
    if (parts[0]) main = parts[0].trim()
    if (!sub || sub.length > 50 || sub.includes('Feiertage vorbei')) {
      sub = parts.slice(1).join(' - ').trim()
    }
  } else if (main.includes(': ')) {
    const parts = main.split(': ')
    if (parts[0]) main = parts[0].trim()
    if (!sub || sub.length > 50 || sub.includes('Feiertage vorbei')) {
      sub = parts.slice(1).join(': ').trim()
    }
  }

  if (
    sub.length > 45 ||
    sub.includes('Feiertage vorbei') ||
    sub.includes('Herzliche Einladung') ||
    sub.includes('Schönstatt-Mannesjugend') ||
    !sub
  ) {
    if (location && location.toLowerCase().includes('klause')) {
      sub = 'KLAUSE 2.0 • HEILIGENSTADT'
    } else if (location && location.toLowerCase().includes('thalwenden')) {
      sub = 'WIESENTHAL BEI THALWENDEN'
    } else if (main.includes('ZELTLAGER')) {
      sub = '10 TAGE EXPEDITION & LAGERFEUER'
    } else {
      sub = 'ACTION & ZEIT UNTER JUNGS'
    }
  }

  return {
    mainTitle: main,
    subTitle: sub.toUpperCase(),
  }
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
 * Built with bold condensed display typography as an unmissable mobile eye-catcher.
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
  const factCardH = options.format === 'story' ? 170 : options.format === 'portrait' ? 155 : 155

  const { mainTitle, subTitle } = parseTitleAndSubtitle(options.title, options.subtitle, options.locationStr)
  const catEsc = escapeXml(options.categoryLabel.toUpperCase())

  // Dynamic eye-catching title size (Impact condensed font)
  const maxTitleSize = options.format === 'story' ? 108 : options.format === 'portrait' ? 96 : 92
  const computedTitleSize = Math.floor(860 / (mainTitle.length * 0.54))
  const titleFontSize = Math.max(54, Math.min(maxTitleSize, computedTitleSize))

  const subFontSize = options.format === 'story' ? 42 : options.format === 'portrait' ? 36 : 34

  const rawFacts = [
    { label: 'WANN', value: options.dateStr },
    { label: 'WO', value: options.locationStr },
    { label: 'WER', value: options.ageStr },
    { label: 'BEITRAG', value: options.priceStr },
  ]

  const factsSvg = rawFacts
    .map((f, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const cardX = col * 458
      const cardY = row * (factCardH + (options.format === 'story' ? 20 : 18))
      const [line1, line2] = splitFact(f.label, f.value)
      const iconSvg = FACT_ICONS[f.label] || ''

      let l1Size = options.format === 'story' ? 44 : 40
      if (line1.length > 16) l1Size -= 10
      else if (line1.length > 12) l1Size -= 4

      const l2Size = options.format === 'story' ? 24 : 22

      return `
      <!-- ${f.label} -->
      <g transform="translate(${cardX}, ${cardY})">
        <rect x="0" y="0" width="430" height="${factCardH}" fill="${factCardBg}" stroke="${factCardStroke}" stroke-width="${isLight ? '2' : '2.5'}" rx="10"/>
        <rect x="0" y="0" width="12" height="${factCardH}" fill="#FF5A1F" rx="4"/>
        <svg x="26" y="20" width="28" height="28" viewBox="0 0 24 24">
          ${iconSvg}
        </svg>
        <text x="66" y="40" fill="#FF5A1F" font-size="20" font-family="Impact, sans-serif" letter-spacing="2">${f.label}</text>
        <text x="26" y="${options.format === 'story' ? 104 : 94}" fill="#F1EBDD" font-size="${l1Size}" font-family="Impact, sans-serif" letter-spacing="1">${escapeXml(line1)}</text>
        ${line2 ? `<text x="26" y="${options.format === 'story' ? 144 : 132}" fill="#C9BA99" font-size="${l2Size}" font-family="sans-serif" font-weight="bold">${escapeXml(line2)}</text>` : ''}
      </g>
    `
    })
    .join('')

  const highlights =
    options.highlights && options.highlights.length > 0
      ? options.highlights.slice(0, 3)
      : [
          'Spannende Aktionen & Geländespiele im Wald',
          'Große Gemeinschaft, Lagerfeuer & Ausflüge',
          '100% draußen, handyfrei & echte Abenteuer',
        ]

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isLight ? '#F5EFE1' : isBlack ? '#000000' : isOrange ? '#241008' : '#182019'}"/>
        <stop offset="50%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="${isLight ? '#E2D7C0' : '#0a0d0b'}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bgGrad)"/>
    
    <!-- Outer Framing Border -->
    ${
      isLight
        ? `
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="#111713" stroke-width="3"/>
    <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="#C9BA99" stroke-width="1.5" stroke-dasharray="8,6"/>
    `
        : `
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="#F1EBDD" stroke-width="2.5" stroke-opacity="0.25"/>
    `
    }
    
    <!-- Corner Brackets in Signal Orange -->
    <path d="M 36 85 L 36 36 L 85 36" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M ${width - 85} 36 L ${width - 36} 36 L ${width - 36} 85" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M 36 ${height - 85} L 36 ${height - 36} L 85 ${height - 36}" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M ${width - 85} ${height - 36} L ${width - 36} ${height - 36} L ${width - 36} ${height - 85}" fill="none" stroke="#FF5A1F" stroke-width="7"/>

    <!-- Header Bar -->
    <g transform="translate(96, ${options.format === 'story' ? 210 : 95})">
      <text x="0" y="0" fill="#FF5A1F" font-size="24" font-family="Impact, sans-serif" letter-spacing="3">SMJ REGIO WEGWEISER</text>
      <rect x="${width - 192 - 180}" y="-26" width="180" height="38" fill="${isLight ? '#111713' : '#FF5A1F'}" rx="4"/>
      <text x="${width - 192 - 90}" y="-1" fill="${isLight ? '#F1EBDD' : '#111713'}" font-size="20" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1">${catEsc}</text>
    </g>

    <!-- Main Title Block (Giant Eye-Catcher) -->
    <g transform="translate(96, ${options.format === 'story' ? 310 : options.format === 'portrait' ? 175 : 160})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 30 : 26}" font-family="Impact, sans-serif" letter-spacing="2">// RAUS. INS ABENTEUER.</text>
      <text x="0" y="${options.format === 'story' ? 95 : options.format === 'portrait' ? 88 : 86}" fill="${textPrimary}" font-size="${titleFontSize}" font-family="Impact, sans-serif" letter-spacing="2">${escapeXml(mainTitle)}</text>
      <text x="0" y="${options.format === 'story' ? 158 : options.format === 'portrait' ? 144 : 142}" fill="#FF5A1F" font-size="${subFontSize}" font-family="Impact, sans-serif" letter-spacing="1.5">// ${escapeXml(subTitle)}</text>
    </g>

    <!-- Key Facts Grid (Big Bold Cards matching Plakat) -->
    <g transform="translate(96, ${options.format === 'story' ? 540 : options.format === 'portrait' ? 370 : 350})">
      ${factsSvg}
    </g>

    ${
      options.format !== 'post'
        ? `
    <!-- Highlights (Shown on Story and Portrait) -->
    <g transform="translate(96, ${options.format === 'story' ? 945 : 735})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 28 : 24}" font-family="Impact, sans-serif" letter-spacing="2">// WAS DICH BEI DIESER AKTION ERWARTET:</text>
      
      ${highlights
        .map(
          (h, i) => `
        <g transform="translate(0, ${28 + i * (options.format === 'story' ? 122 : 104)})">
          <rect x="0" y="0" width="888" height="${options.format === 'story' ? 105 : 92}" fill="${isLight ? '#FFFFFF' : '#182019'}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="${isLight ? '2.5' : '1.5'}" stroke-opacity="${isLight ? '1' : '0.2'}" rx="10"/>
          <text x="32" y="${options.format === 'story' ? 66 : 58}" fill="#FF5A1F" font-size="${options.format === 'story' ? 40 : 36}" font-family="Impact, sans-serif">0${i + 1}</text>
          <text x="98" y="${options.format === 'story' ? 62 : 56}" fill="${textPrimary}" font-size="${options.format === 'story' ? 28 : 25}" font-family="sans-serif" font-weight="bold">${escapeXml(h)}</text>
        </g>
      `,
        )
        .join('')}
    </g>
    `
        : ''
    }

    <!-- Bottom Action Banner CTA (Unmissable for Mobile Feed & Story) -->
    <g transform="translate(96, ${options.format === 'story' ? 1345 : options.format === 'portrait' ? 1075 : 715})">
      <rect x="0" y="0" width="888" height="${options.format === 'story' ? 270 : options.format === 'portrait' ? 215 : 240}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#FF5A1F'}" stroke-width="3.5" rx="12"/>
      
      <rect x="32" y="26" width="240" height="42" fill="#FF5A1F" rx="4"/>
      <text x="152" y="55" fill="#111713" font-size="22" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1">JETZT ANMELDEN</text>

      <text x="32" y="${options.format === 'story' ? 132 : options.format === 'portrait' ? 112 : 122}" fill="${textPrimary}" font-size="${options.format === 'story' ? 46 : 42}" font-family="Impact, sans-serif" letter-spacing="1">PLÄTZE ONLINE SICHERN:</text>
      <text x="32" y="${options.format === 'story' ? 196 : options.format === 'portrait' ? 168 : 182}" fill="#FF5A1F" font-size="${options.format === 'story' ? 60 : 54}" font-family="Impact, sans-serif" letter-spacing="2">SMJ-WEGWEISER.DE</text>
      
      <text x="32" y="${options.format === 'story' ? 238 : options.format === 'portrait' ? 200 : 216}" fill="${isLight ? '#3D453E' : textMuted}" font-size="${options.format === 'story' ? 24 : 21}" font-family="sans-serif" font-weight="bold">Link in Bio anklicken • Alle Infos &amp; Packliste online!</text>

      <!-- Action Arrow Circle Button -->
      <g transform="translate(${888 - 32 - 110}, ${options.format === 'story' ? 80 : options.format === 'portrait' ? 52 : 65})">
        <circle cx="55" cy="55" r="55" fill="#FF5A1F"/>
        <path d="M38 55 L72 55 M60 41 L74 55 L60 69" fill="none" stroke="#111713" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>

    <!-- Footer Copyright Note -->
    <text x="${width / 2}" y="${height - (options.format === 'story' ? 150 : 40)}" fill="${textPrimary}" fill-opacity="${isLight ? '0.85' : '0.6'}" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SMJ Regio Wegweiser • Katholische Schönstatt-Mannesjugend • smj-wegweiser.de</text>
  </svg>`
}

/**
 * Generates an SVG string for a multi-slide schedule carousel.
 * Bold, high-contrast, condensed impact typography for phone screens.
 */
export async function generateScheduleSlideSvg(options: ScheduleSlideSocialOptions): Promise<string> {
  const width = 1080
  const height = options.format === 'story' ? 1920 : 1080
  const isLight = options.theme === 'light'

  const bgColor = isLight ? '#F5EFE1' : '#111713'
  const cardBg = isLight ? '#FFFFFF' : '#182019'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const textMuted = isLight ? '#4A524A' : '#C9BA99'

  const isLastSlide = options.slideIndex === options.totalSlides - 1
  const eventsCount = options.events.length

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="slideBgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isLight ? '#F5EFE1' : '#182019'}"/>
        <stop offset="50%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="${isLight ? '#E2D7C0' : '#0a0d0b'}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#slideBgGrad)"/>
    
    <!-- Outer Framing Border -->
    ${
      isLight
        ? `
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="#111713" stroke-width="3"/>
    <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="#C9BA99" stroke-width="1.5" stroke-dasharray="8,6"/>
    `
        : `
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="#F1EBDD" stroke-width="2.5" stroke-opacity="0.25"/>
    `
    }
    
    <!-- Corner Brackets in Signal Orange -->
    <path d="M 36 85 L 36 36 L 85 36" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M ${width - 85} 36 L ${width - 36} 36 L ${width - 36} 85" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M 36 ${height - 85} L 36 ${height - 36} L 85 ${height - 36}" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M ${width - 85} ${height - 36} L ${width - 36} ${height - 36} L ${width - 36} ${height - 85}" fill="none" stroke="#FF5A1F" stroke-width="7"/>

    <!-- Header Bar -->
    <g transform="translate(96, ${options.format === 'story' ? 210 : 95})">
      <text x="0" y="0" fill="#FF5A1F" font-size="24" font-family="Impact, sans-serif" letter-spacing="3">SMJ REGIO WEGWEISER</text>
      <rect x="${width - 192 - 180}" y="-26" width="180" height="38" fill="${isLight ? '#111713' : '#FF5A1F'}" rx="4"/>
      <text x="${width - 192 - 90}" y="-1" fill="${isLight ? '#F1EBDD' : '#111713'}" font-size="20" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1">TEIL ${options.slideIndex + 1} / ${options.totalSlides}</text>
    </g>

    ${
      !isLastSlide
        ? `
    <!-- Title Section -->
    <g transform="translate(96, ${options.format === 'story' ? 310 : 165})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 30 : 26}" font-family="Impact, sans-serif" letter-spacing="2">// TERMINE &amp; AKTIONEN</text>
      <text x="0" y="${options.format === 'story' ? 88 : 74}" fill="${textPrimary}" font-size="${options.format === 'story' ? 84 : 70}" font-family="Impact, sans-serif" letter-spacing="2">${escapeXml(options.periodTitle.toUpperCase())}</text>
      <text x="0" y="${options.format === 'story' ? 148 : 126}" fill="#FF5A1F" font-size="${options.format === 'story' ? 36 : 30}" font-family="Impact, sans-serif" letter-spacing="1.5">// ${escapeXml((options.periodSubtitle || 'ALLE AKTIONEN IM ÜBERBLICK').toUpperCase())}</text>
    </g>

    <!-- Events Cards List (Huge Bold Cards for Mobile Readability) -->
    <g transform="translate(96, ${options.format === 'story' ? 510 : 330})">
      ${options.events
        .map((ev, i) => {
          const itemH =
            options.format === 'story'
              ? eventsCount <= 2 ? 340 : eventsCount === 3 ? 260 : 210
              : eventsCount <= 2 ? 220 : eventsCount === 3 ? 170 : 135
          const gap = options.format === 'story' ? 24 : 18
          const yPos = i * (itemH + gap)

          const dateSize = options.format === 'story' ? 32 : eventsCount <= 2 ? 28 : 24
          const titleSize = options.format === 'story' ? 46 : eventsCount <= 2 ? 42 : eventsCount === 3 ? 36 : 30
          const locSize = options.format === 'story' ? 26 : eventsCount <= 2 ? 24 : eventsCount === 3 ? 22 : 19

          return `
          <g transform="translate(0, ${yPos})">
            <rect x="0" y="0" width="888" height="${itemH}" fill="${isLight ? '#111713' : '#182019'}" stroke="${isLight ? '#111713' : '#2D3B2F'}" stroke-width="${isLight ? '2' : '2.5'}" rx="10"/>
            <rect x="0" y="0" width="12" height="${itemH}" fill="#FF5A1F" rx="4"/>
            <text x="32" y="${options.format === 'story' ? 60 : eventsCount <= 2 ? 52 : 44}" fill="#FF5A1F" font-size="${dateSize}" font-family="Impact, sans-serif" letter-spacing="1.5">${escapeXml(ev.dateStr.toUpperCase())}</text>
            <text x="32" y="${options.format === 'story' ? 128 : eventsCount <= 2 ? 112 : 96}" fill="#F1EBDD" font-size="${titleSize}" font-family="Impact, sans-serif" letter-spacing="1">${escapeXml(ev.title.toUpperCase())}</text>
            <text x="32" y="${options.format === 'story' ? 186 : eventsCount <= 2 ? 164 : 140}" fill="#C9BA99" font-size="${locSize}" font-family="sans-serif" font-weight="bold">${escapeXml([ev.location, ev.ageGroup].filter(Boolean).join(' • '))}</text>
          </g>
        `
        })
        .join('')}
    </g>
    `
        : `
    <!-- Final CTA Slide: Registration & Highlights -->
    <g transform="translate(96, ${options.format === 'story' ? 310 : 165})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 30 : 26}" font-family="Impact, sans-serif" letter-spacing="2">// JETZT ANMELDEN</text>
      <text x="0" y="${options.format === 'story' ? 88 : 74}" fill="${textPrimary}" font-size="${options.format === 'story' ? 84 : 70}" font-family="Impact, sans-serif" letter-spacing="2">ALLE INFOS ONLINE</text>
      <text x="0" y="${options.format === 'story' ? 148 : 126}" fill="#FF5A1F" font-size="${options.format === 'story' ? 36 : 30}" font-family="Impact, sans-serif" letter-spacing="1.5">// PLÄTZE SICHERN &amp; KALENDER ABONNIEREN</text>
    </g>

    <!-- 3 Highlight Feature Cards -->
    <g transform="translate(96, ${options.format === 'story' ? 510 : 330})">
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="888" height="${options.format === 'story' ? 120 : 92}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="${isLight ? '2.5' : '1.5'}" stroke-opacity="${isLight ? '1' : '0.2'}" rx="10"/>
        <text x="32" y="${options.format === 'story' ? 74 : 58}" fill="#FF5A1F" font-size="${options.format === 'story' ? 40 : 34}" font-family="Impact, sans-serif">01</text>
        <text x="100" y="${options.format === 'story' ? 70 : 56}" fill="${textPrimary}" font-size="${options.format === 'story' ? 30 : 26}" font-family="sans-serif" font-weight="bold">ECHTE NATUR &amp; LAGERFEUER</text>
      </g>
      <g transform="translate(0, ${options.format === 'story' ? 144 : 110})">
        <rect x="0" y="0" width="888" height="${options.format === 'story' ? 120 : 92}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="${isLight ? '2.5' : '1.5'}" stroke-opacity="${isLight ? '1' : '0.2'}" rx="10"/>
        <text x="32" y="${options.format === 'story' ? 74 : 58}" fill="#FF5A1F" font-size="${options.format === 'story' ? 40 : 34}" font-family="Impact, sans-serif">02</text>
        <text x="100" y="${options.format === 'story' ? 70 : 56}" fill="${textPrimary}" font-size="${options.format === 'story' ? 30 : 26}" font-family="sans-serif" font-weight="bold">JUNGS VON 9 BIS 14 JAHREN</text>
      </g>
      <g transform="translate(0, ${options.format === 'story' ? 288 : 220})">
        <rect x="0" y="0" width="888" height="${options.format === 'story' ? 120 : 92}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="${isLight ? '2.5' : '1.5'}" stroke-opacity="${isLight ? '1' : '0.2'}" rx="10"/>
        <text x="32" y="${options.format === 'story' ? 74 : 58}" fill="#FF5A1F" font-size="${options.format === 'story' ? 40 : 34}" font-family="Impact, sans-serif">03</text>
        <text x="100" y="${options.format === 'story' ? 70 : 56}" fill="${textPrimary}" font-size="${options.format === 'story' ? 30 : 26}" font-family="sans-serif" font-weight="bold">JUGEND LEITET JUGEND &#8226; 100% DRAUSSEN</text>
      </g>
    </g>

    <!-- Large Action Box -->
    <g transform="translate(96, ${options.format === 'story' ? 980 : 660})">
      <rect x="0" y="0" width="888" height="${options.format === 'story' ? 300 : 255}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#FF5A1F'}" stroke-width="3.5" rx="12"/>
      
      <rect x="32" y="28" width="240" height="42" fill="#FF5A1F" rx="4"/>
      <text x="152" y="57" fill="#111713" font-size="22" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1">ONLINE ANMELDEN</text>

      <text x="32" y="${options.format === 'story' ? 135 : 124}" fill="${textPrimary}" font-size="${options.format === 'story' ? 46 : 42}" font-family="Impact, sans-serif" letter-spacing="1">ALLE AKTIONEN &amp; TERMINE:</text>
      <text x="32" y="${options.format === 'story' ? 202 : 186}" fill="#FF5A1F" font-size="${options.format === 'story' ? 58 : 52}" font-family="Impact, sans-serif" letter-spacing="2">SMJ-WEGWEISER.DE</text>
      <text x="32" y="${options.format === 'story' ? 250 : 224}" fill="${isLight ? '#3D453E' : textMuted}" font-size="${options.format === 'story' ? 24 : 21}" font-family="sans-serif" font-weight="bold">Kalender als iCal / Google abonnieren: /api/calendar.ics</text>

      <g transform="translate(${888 - 32 - 110}, ${options.format === 'story' ? 95 : 70})">
        <circle cx="55" cy="55" r="55" fill="#FF5A1F"/>
        <path d="M38 55 L72 55 M60 41 L74 55 L60 69" fill="none" stroke="#111713" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>
    `
    }

    <!-- Footer Copyright -->
    <text x="${width / 2}" y="${height - (options.format === 'story' ? 150 : 40)}" fill="${textPrimary}" fill-opacity="${isLight ? '0.85' : '0.6'}" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SMJ Regio Wegweiser • Katholische Schönstatt-Mannesjugend • smj-wegweiser.de</text>
  </svg>`
}

/**
 * Converts an SVG string to a high-resolution PNG Buffer using sharp.
 */
export async function renderSvgToPng(svgString: string): Promise<Buffer> {
  return await sharp(Buffer.from(svgString)).png({ compressionLevel: 8 }).toBuffer()
}
