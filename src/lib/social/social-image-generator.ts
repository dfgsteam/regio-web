import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import QRCode from 'qrcode'
import type { ScheduleEventItem } from '../pdf/schedule-pdf'

let whiteLogoInnerCache: string | null = null
let darkLogoInnerCache: string | null = null

function getLogoInner(isDark: boolean): string {
  if (isDark && whiteLogoInnerCache) return whiteLogoInnerCache
  if (!isDark && darkLogoInnerCache) return darkLogoInnerCache

  const fileName = isDark ? 'logo_wegweiser_white.svg' : 'logo_wegweiser_dark.svg'
  const filePath = path.resolve(process.cwd(), 'public', fileName)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const match = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
    const inner = match?.[1] ? match[1].trim() : ''
    if (isDark) whiteLogoInnerCache = inner
    else darkLogoInnerCache = inner
    return inner
  } catch {
    return ''
  }
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

function getDisplayDomain(url?: string): string {
  if (!url) return 'smj-wegweiser.de'
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.host || 'smj-wegweiser.de'
  } catch {
    return 'smj-wegweiser.de'
  }
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
    sub.length > 35 ||
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
  format: 'story' | 'post' | 'portrait' | 'post-slide-1' | 'post-slide-2' | 'whatsapp'
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

function renderEventFactCards(rawFacts: { label: string; value: string }[], isLight: boolean, cardH = 168) {
  const factCardBg = isLight ? '#111713' : '#182019'
  const factCardStroke = isLight ? '#111713' : '#2D3B2F'
  return rawFacts
    .map((f, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const cardX = col * 458
      const cardY = row * (cardH + 18)
      const [line1, line2] = splitFact(f.label, f.value)
      const iconSvg = FACT_ICONS[f.label] || ''

      let l1Size = cardH > 150 ? 42 : 38
      if (line1.length > 16) l1Size -= 8
      else if (line1.length > 12) l1Size -= 4

      const l1Y = cardH > 150 ? 94 : 82
      const l2Y = cardH > 150 ? 134 : 114
      const l2Size = cardH > 150 ? 22 : 19

      return `
      <!-- ${f.label} -->
      <g transform="translate(${cardX}, ${cardY})">
        <rect x="0" y="0" width="430" height="${cardH}" fill="${factCardBg}" stroke="${factCardStroke}" stroke-width="${isLight ? '2' : '2.5'}" rx="12"/>
        <rect x="0" y="0" width="12" height="${cardH}" fill="#FF5A1F" rx="4"/>
        <svg x="26" y="${cardH > 150 ? 20 : 16}" width="24" height="24" viewBox="0 0 24 24">
          ${iconSvg}
        </svg>
        <text x="60" y="${cardH > 150 ? 38 : 34}" fill="#FF5A1F" font-size="18" font-family="Impact, sans-serif" letter-spacing="2">${f.label}</text>
        <text x="26" y="${l1Y}" fill="#F1EBDD" font-size="${l1Size}" font-family="Impact, sans-serif" letter-spacing="1">${escapeXml(line1)}</text>
        ${line2 ? `<text x="26" y="${l2Y}" fill="#C9BA99" font-size="${l2Size}" font-family="sans-serif" font-weight="bold">${escapeXml(line2)}</text>` : ''}
      </g>
    `
    })
    .join('')
}

interface BrandHeaderOptions {
  format: 'story' | 'post' | 'portrait' | 'whatsapp' | 'post-slide-1' | 'post-slide-2'
  theme: 'dark' | 'light' | 'orange' | 'black'
  categoryLabel?: string
  secondBadge?: string
  isWhatsApp?: boolean
}

function renderBrandHeader(options: BrandHeaderOptions): string {
  const isStory = options.format === 'story'
  const isLight = options.theme === 'light'
  const isBlack = options.theme === 'black'
  const isOrange = options.theme === 'orange'
  const isWhatsApp = Boolean(options.isWhatsApp)

  // Emblem Patch Dimensions
  const badgeW = isStory ? 104 : 84
  const badgeH = isStory ? 92 : 74
  const iconW = isStory ? 84 : 68
  const iconH = isStory ? 74 : 60
  const yPos = isStory ? 200 : 85

  // Typography Dimensions
  const titleSize = isStory ? 35 : 28
  const eyebrowSize = isStory ? 14 : 12
  const rightBadgeH = isStory ? 48 : 40
  const rightBadgeFontSize = isStory ? 22 : 18

  // Colors
  const badgeBg = isLight ? '#111713' : isBlack ? '#000000' : isOrange ? '#1a0c07' : '#182019'
  const badgeStroke = isWhatsApp ? '#25D366' : isLight ? '#111713' : '#FF5A1F'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const accentColor = isWhatsApp ? '#25D366' : '#FF5A1F'
  const logoInner = getLogoInner(true) // Always crisp white vector inside the dark badge!

  const categoryLabel = options.categoryLabel || 'AKTION'
  const badgeOffset = options.secondBadge ? 280 : isWhatsApp ? 270 : 180

  return `
  <!-- Premium Brand Header Bar -->
  <g transform="translate(96, ${yPos})">
    <!-- Emblem Patch / Logo Stamp -->
    <g transform="translate(0, ${isStory ? -14 : -10})">
      <rect x="0" y="0" width="${badgeW}" height="${badgeH}" fill="${badgeBg}" stroke="${badgeStroke}" stroke-width="2.5" rx="10"/>
      <g transform="translate(${(badgeW - iconW) / 2}, ${(badgeH - iconH) / 2})">
        <svg width="${iconW}" height="${iconH}" viewBox="0 0 328 288">${logoInner}</svg>
      </g>
    </g>

    <!-- Two-Tier Brand Lockup -->
    <g transform="translate(${badgeW + 20}, ${isStory ? 24 : 18})">
      <text x="0" y="0" fill="${accentColor}" font-size="${eyebrowSize}" font-family="sans-serif" font-weight="bold" letter-spacing="2.5">SCHÖNSTATT-MANNESJUGEND</text>
      <text x="0" y="${isStory ? 36 : 28}" fill="${textPrimary}" font-size="${titleSize}" font-family="Impact, sans-serif" letter-spacing="2">SMJ REGIO WEGWEISER</text>
    </g>

    <!-- Badges Right -->
    <g transform="translate(${888 - badgeOffset}, ${isStory ? 8 : 6})">
      ${
        isWhatsApp
          ? `
        <rect x="0" y="0" width="270" height="${rightBadgeH}" fill="${isLight ? '#e7f7ed' : '#0d2b1a'}" stroke="#25D366" stroke-width="2" rx="6"/>
        <text x="135" y="${isStory ? 32 : 26}" fill="#25D366" font-size="${rightBadgeFontSize}" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1.5">WHATSAPP COMMUNITY</text>
          `
          : `
        <rect x="0" y="0" width="${options.secondBadge ? 140 : 180}" height="${rightBadgeH}" fill="${isLight ? '#111713' : '#FF5A1F'}" rx="6"/>
        <text x="${(options.secondBadge ? 140 : 180) / 2}" y="${isStory ? 32 : 26}" fill="${isLight ? '#F1EBDD' : '#111713'}" font-size="${rightBadgeFontSize}" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1.5">${escapeXml(categoryLabel.toUpperCase())}</text>
        `
      }

      ${
        options.secondBadge
          ? `
        <rect x="150" y="0" width="120" height="${rightBadgeH}" fill="${isLight ? '#FFFFFF' : '#182019'}" stroke="#FF5A1F" stroke-width="2" rx="6"/>
        <text x="210" y="${isStory ? 32 : 26}" fill="#FF5A1F" font-size="${rightBadgeFontSize - 1}" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1.5">${escapeXml(options.secondBadge.toUpperCase())}</text>
          `
          : ''
      }
    </g>

    <!-- Bottom Separator Rule -->
    <line x1="0" y1="${isStory ? 104 : 84}" x2="888" y2="${isStory ? 104 : 84}" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="2" stroke-opacity="${isLight ? '0.15' : '0.18'}"/>
  </g>
  `
}

/**
 * Instagram Post - Slide 1: Clean, Fact-driven Cover + Swipe Indicator
 */
async function generatePostSlide1Svg(options: EventSocialOptions): Promise<string> {
  const width = 1080
  const height = 1080
  const isLight = options.theme === 'light'
  const logoInner = getLogoInner(!isLight)

  const bgColor = isLight ? '#F5EFE1' : '#111713'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const displayDomain = getDisplayDomain(options.targetUrl)

  const { mainTitle } = parseTitleAndSubtitle(options.title, options.subtitle, options.locationStr)

  const rawFacts = [
    { label: 'WANN', value: options.dateStr },
    { label: 'WO', value: options.locationStr },
    { label: 'WER', value: options.ageStr },
    { label: 'BEITRAG', value: options.priceStr },
  ]
  const factsSvg = renderEventFactCards(rawFacts, isLight, 168)

  const computedTitleSize = Math.floor(860 / (mainTitle.length * 0.54))
  const titleFontSize = Math.max(54, Math.min(88, computedTitleSize))

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradP1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isLight ? '#F5EFE1' : '#182019'}"/>
        <stop offset="50%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="${isLight ? '#E2D7C0' : '#0a0d0b'}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bgGradP1)"/>

    <!-- Watermark Logo -->
    <g transform="translate(620, 260) rotate(12) scale(2.4)" opacity="${isLight ? '0.05' : '0.06'}">
      <svg width="328" height="288" viewBox="0 0 328 288">${logoInner}</svg>
    </g>

    <!-- Framing -->
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="2.5" stroke-opacity="${isLight ? '0.8' : '0.25'}"/>
    <path d="M 36 85 L 36 36 L 85 36" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M ${width - 85} 36 L ${width - 36} 36 L ${width - 36} 85" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M 36 ${height - 85} L 36 ${height - 36} L 85 ${height - 36}" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M ${width - 85} ${height - 36} L ${width - 36} ${height - 36} L ${width - 36} ${height - 85}" fill="none" stroke="#FF5A1F" stroke-width="7"/>

    ${renderBrandHeader({ format: 'post', theme: options.theme, categoryLabel: options.categoryLabel, secondBadge: 'Slide 1/2' })}

    <!-- Title Block (No subtitle) -->
    <g transform="translate(96, 198)">
      <text x="0" y="0" fill="#FF5A1F" font-size="26" font-family="Impact, sans-serif" letter-spacing="3">// NÄCHSTE AKTION DER SMJ</text>
      <text x="0" y="74" fill="${textPrimary}" font-size="${titleFontSize}" font-family="Impact, sans-serif" letter-spacing="2">${escapeXml(mainTitle)}</text>
    </g>

    <!-- 4 Key Fact Cards (2x2) -->
    <g transform="translate(96, 335)">
      ${factsSvg}
    </g>

    <!-- Bottom Carousel Swipe Bar (No highlights strip) -->
    <g transform="translate(96, 735)">
      <rect x="0" y="0" width="888" height="185" fill="#FF5A1F" rx="14"/>
      
      <g transform="translate(40, 36)">
        <rect x="0" y="0" width="280" height="36" fill="#111713" rx="4"/>
        <text x="140" y="25" fill="#FF5A1F" font-size="19" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1.5">WISCHE WEITER ZU SLIDE 2</text>
        
        <text x="0" y="86" fill="#111713" font-size="38" font-family="Impact, sans-serif" letter-spacing="1">DIREKTER QR-CODE ZUR ANMELDUNG</text>
        <text x="0" y="124" fill="#111713" font-size="22" font-family="sans-serif" font-weight="bold">Auf der nächsten Seite einfach mit der Kamera scannen &amp; Platz sichern!</text>
      </g>

      <!-- Carousel arrow circle -->
      <g transform="translate(${888 - 45 - 84}, 50)">
        <circle cx="42" cy="42" r="42" fill="#111713"/>
        <path d="M28 42 L56 42 M44 30 L56 42 L44 54" fill="none" stroke="#FF5A1F" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>

    <!-- Footer Copyright -->
    <text x="${width / 2}" y="${height - 48}" fill="${textPrimary}" fill-opacity="${isLight ? '0.75' : '0.6'}" font-size="19" font-family="sans-serif" font-weight="bold" text-anchor="middle">SMJ Regio Wegweiser • ${displayDomain} • Schönstatt-Mannesjugend</text>
  </svg>`
}

/**
 * Instagram Post - Slide 2: Dominant Centered QR-Code & Bio Link Callout
 */
async function generatePostSlide2Svg(options: EventSocialOptions): Promise<string> {
  const width = 1080
  const height = 1080
  const isLight = options.theme === 'light'
  const logoInner = getLogoInner(!isLight)

  const bgColor = isLight ? '#F5EFE1' : '#111713'
  const cardBg = isLight ? '#FFFFFF' : '#182019'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const textMuted = isLight ? '#4A524A' : '#C9BA99'
  const displayDomain = getDisplayDomain(options.targetUrl)

  const { mainTitle } = parseTitleAndSubtitle(options.title, options.subtitle, options.locationStr)

  // Generate large high-res crisp QR Code
  const qrDataUrl = await QRCode.toDataURL(options.targetUrl, {
    margin: 1,
    width: 320,
    color: {
      dark: '#111713',
      light: '#FFFFFF',
    },
  })

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradP2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isLight ? '#F5EFE1' : '#182019'}"/>
        <stop offset="50%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="${isLight ? '#E2D7C0' : '#0a0d0b'}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bgGradP2)"/>

    <!-- Watermark Logo -->
    <g transform="translate(620, 260) rotate(12) scale(2.4)" opacity="${isLight ? '0.05' : '0.06'}">
      <svg width="328" height="288" viewBox="0 0 328 288">${logoInner}</svg>
    </g>

    <!-- Framing -->
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="2.5" stroke-opacity="${isLight ? '0.8' : '0.25'}"/>
    <path d="M 36 85 L 36 36 L 85 36" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M ${width - 85} 36 L ${width - 36} 36 L ${width - 36} 85" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M 36 ${height - 85} L 36 ${height - 36} L 85 ${height - 36}" fill="none" stroke="#FF5A1F" stroke-width="7"/>
    <path d="M ${width - 85} ${height - 36} L ${width - 36} ${height - 36} L ${width - 36} ${height - 85}" fill="none" stroke="#FF5A1F" stroke-width="7"/>

    ${renderBrandHeader({ format: 'post', theme: options.theme, categoryLabel: options.categoryLabel, secondBadge: 'Slide 2/2' })}

    <!-- Title Block -->
    <g transform="translate(96, 198)">
      <text x="0" y="0" fill="#FF5A1F" font-size="26" font-family="Impact, sans-serif" letter-spacing="3">// JETZT ONLINE ANMELDEN</text>
      <text x="0" y="74" fill="${textPrimary}" font-size="76" font-family="Impact, sans-serif" letter-spacing="2">${escapeXml(mainTitle)}</text>
    </g>

    <!-- Big Centerpiece QR-Code & CTA Card -->
    <g transform="translate(96, 305)">
      <rect x="0" y="0" width="888" height="645" fill="${cardBg}" stroke="${isLight ? '#111713' : '#FF5A1F'}" stroke-width="3" rx="16"/>

      <!-- Large QR-Code Frame (Centered: (888 - 360) / 2 = 264) -->
      <g transform="translate(264, 40)">
        <rect x="0" y="0" width="360" height="360" fill="#FFFFFF" stroke="#ded8c8" stroke-width="3" rx="16"/>
        <image x="20" y="20" width="320" height="320" href="${qrDataUrl}"/>
      </g>

      <!-- CTA Headlines below QR Code -->
      <g transform="translate(444, 440)" text-anchor="middle">
        <text x="0" y="0" fill="${textPrimary}" font-size="44" font-family="Impact, sans-serif" letter-spacing="1.5">QR-CODE MIT DER KAMERA SCANNEN</text>
        <text x="0" y="42" fill="#FF5A1F" font-size="28" font-family="Impact, sans-serif" letter-spacing="1">ODER LINK IN DER BIO ANKLICKEN!</text>
      </g>

      <!-- Direct Link Pill (Centered: (888 - 600) / 2 = 144) -->
      <g transform="translate(144, 522)">
        <rect x="0" y="0" width="600" height="52" fill="${isLight ? '#F5EFE1' : '#111713'}" stroke="${isLight ? '#111713' : '#2D3B2F'}" stroke-width="2" rx="8"/>
        <!-- Link Icon -->
        <svg x="24" y="14" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <text x="64" y="34" fill="#FF5A1F" font-size="22" font-family="Impact, sans-serif" letter-spacing="1">${escapeXml(options.targetUrl.replace(/^https?:\/\//, ''))}</text>
      </g>

      <!-- Instructional Subline -->
      <text x="444" y="618" fill="${textMuted}" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">
        Kamera-App öffnen • Auf den Code halten • Link antippen &amp; Platz sichern
      </text>
    </g>

    <!-- Footer Copyright -->
    <text x="${width / 2}" y="${height - 48}" fill="${textPrimary}" fill-opacity="${isLight ? '0.75' : '0.6'}" font-size="19" font-family="sans-serif" font-weight="bold" text-anchor="middle">SMJ Regio Wegweiser • ${displayDomain} • Schönstatt-Mannesjugend</text>
  </svg>`
}

/**
 * WhatsApp Community Card: High-contrast, informative, NO QR CODE
 */
async function generateWhatsAppSvg(options: EventSocialOptions): Promise<string> {
  const width = 1080
  const height = 1080
  const isLight = options.theme === 'light'
  const logoInner = getLogoInner(!isLight)

  const bgColor = isLight ? '#F5EFE1' : '#111713'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const displayDomain = getDisplayDomain(options.targetUrl)

  const { mainTitle } = parseTitleAndSubtitle(options.title, options.subtitle, options.locationStr)

  const rawFacts = [
    { label: 'WANN', value: options.dateStr },
    { label: 'WO', value: options.locationStr },
    { label: 'WER', value: options.ageStr },
    { label: 'BEITRAG', value: options.priceStr },
  ]
  const factsSvg = renderEventFactCards(rawFacts, isLight, 168)

  const computedTitleSize = Math.floor(860 / (mainTitle.length * 0.54))
  const titleFontSize = Math.max(54, Math.min(88, computedTitleSize))

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradWa" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isLight ? '#F5EFE1' : '#182019'}"/>
        <stop offset="50%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="${isLight ? '#E2D7C0' : '#0a0d0b'}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bgGradWa)"/>

    <!-- Watermark Logo -->
    <g transform="translate(620, 260) rotate(12) scale(2.4)" opacity="${isLight ? '0.05' : '0.06'}">
      <svg width="328" height="288" viewBox="0 0 328 288">${logoInner}</svg>
    </g>

    <!-- Framing with WhatsApp Green Touch -->
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="${isLight ? '#111713' : '#F1EBDD'}" stroke-width="2.5" stroke-opacity="${isLight ? '0.8' : '0.25'}"/>
    <path d="M 36 85 L 36 36 L 85 36" fill="none" stroke="#25D366" stroke-width="7"/>
    <path d="M ${width - 85} 36 L ${width - 36} 36 L ${width - 36} 85" fill="none" stroke="#25D366" stroke-width="7"/>
    <path d="M 36 ${height - 85} L 36 ${height - 36} L 85 ${height - 36}" fill="none" stroke="#25D366" stroke-width="7"/>
    <path d="M ${width - 85} ${height - 36} L ${width - 36} ${height - 36} L ${width - 36} ${height - 85}" fill="none" stroke="#25D366" stroke-width="7"/>

    ${renderBrandHeader({ format: 'post', theme: options.theme, isWhatsApp: true })}

    <!-- Title Block (No subtitle) -->
    <g transform="translate(96, 198)">
      <text x="0" y="0" fill="#25D366" font-size="26" font-family="Impact, sans-serif" letter-spacing="3">// NÄCHSTE AKTION DER SMJ</text>
      <text x="0" y="74" fill="${textPrimary}" font-size="${titleFontSize}" font-family="Impact, sans-serif" letter-spacing="2">${escapeXml(mainTitle)}</text>
    </g>

    <!-- 4 Key Fact Cards (2x2) -->
    <g transform="translate(96, 335)">
      ${factsSvg}
    </g>

    <!-- WhatsApp Bottom Action Box: NO QR CODE, Clear Message Link CTA -->
    <g transform="translate(96, 730)">
      <rect x="0" y="0" width="888" height="210" fill="${isLight ? '#f2fbf5' : '#0c1d12'}" stroke="#25D366" stroke-width="3" rx="14"/>
      <rect x="0" y="0" width="16" height="210" fill="#25D366" rx="6"/>

      <!-- WhatsApp Action Text -->
      <g transform="translate(44, 32)">
        <rect x="0" y="0" width="310" height="38" fill="#25D366" rx="4"/>
        <text x="155" y="25" fill="#0a1a0f" font-size="20" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1.5">ONLINE-ANMELDUNG &amp; DETAILS</text>

        <text x="0" y="86" fill="${isLight ? '#111713' : '#FFFFFF'}" font-size="40" font-family="Impact, sans-serif" letter-spacing="1">ANMELDELINK DIREKT IN DER NACHRICHT!</text>
        
        <text x="0" y="128" fill="${isLight ? '#2d4b38' : '#E0F2E9'}" font-size="22" font-family="sans-serif" font-weight="bold">Tippe auf den Link im Chat unter diesem Bild, um alle Infos zu sehen.</text>
        <text x="0" y="158" fill="#25D366" font-size="20" font-family="sans-serif" font-weight="bold">🚀 Gerne in WhatsApp-Gruppen &amp; an interessierte Eltern weiterleiten!</text>
      </g>

      <!-- Downward Arrow Circle (Pointing to the message text below!) -->
      <g transform="translate(${888 - 44 - 84}, 62)">
        <circle cx="42" cy="42" r="42" fill="#25D366"/>
        <path d="M42 22 L42 56 M28 42 L42 56 L56 42" fill="none" stroke="#0a1a0f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>

    <!-- Footer Copyright -->
    <text x="${width / 2}" y="${height - 48}" fill="${textPrimary}" fill-opacity="${isLight ? '0.75' : '0.6'}" font-size="19" font-family="sans-serif" font-weight="bold" text-anchor="middle">SMJ Regio Wegweiser • ${displayDomain} • Schönstatt-Mannesjugend</text>
  </svg>`
}

/**
 * Generates an SVG string for a single-event social media graphic.
 * Built with bold condensed display typography as an unmissable mobile eye-catcher.
 */
export async function generateEventSocialSvg(options: EventSocialOptions): Promise<string> {
  // Delegate specialized layouts
  if (options.format === 'post-slide-2') {
    return await generatePostSlide2Svg(options)
  }
  if (options.format === 'whatsapp') {
    return await generateWhatsAppSvg(options)
  }
  if (options.format === 'post' || options.format === 'post-slide-1') {
    return await generatePostSlide1Svg(options)
  }

  const width = 1080
  const height = options.format === 'story' ? 1920 : options.format === 'portrait' ? 1350 : 1080
  const isLight = options.theme === 'light'
  const isOrange = options.theme === 'orange'
  const isBlack = options.theme === 'black'
  const logoInner = getLogoInner(!isLight)

  // Colors
  const bgColor = isLight ? '#F5EFE1' : isBlack ? '#050706' : isOrange ? '#1a0c07' : '#111713'
  const cardBg = isLight ? '#FFFFFF' : '#182019'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const textMuted = isLight ? '#4A524A' : '#C9BA99'
  const displayDomain = getDisplayDomain(options.targetUrl)

  // Fact cards: Solid dark forest cards (#111713) for high contrast and plakat feel
  const factCardBg = isLight ? '#111713' : isBlack ? '#090d0b' : isOrange ? '#1c0e09' : '#182019'
  const factCardStroke = isLight ? '#111713' : isBlack ? '#1e2420' : isOrange ? 'rgba(255,90,31,0.3)' : '#2D3B2F'
  const factCardH = options.format === 'story' ? 170 : options.format === 'portrait' ? 155 : 155

  const { mainTitle, subTitle } = parseTitleAndSubtitle(options.title, options.subtitle, options.locationStr)

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

    <!-- Background Watermark Logo -->
    <g transform="translate(${options.format === 'story' ? '560, 480' : options.format === 'portrait' ? '580, 320' : '600, 240'}) rotate(12) scale(${options.format === 'story' ? '2.8' : '2.3'})" opacity="${isLight ? '0.06' : '0.07'}">
      <svg width="328" height="288" viewBox="0 0 328 288">
        ${logoInner}
      </svg>
    </g>
    
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

    ${renderBrandHeader({ format: options.format, theme: options.theme, categoryLabel: options.categoryLabel })}

    <!-- Main Title Block (Giant Eye-Catcher) -->
    <g transform="translate(96, ${options.format === 'story' ? 340 : options.format === 'portrait' ? 185 : 185})">
      <text x="0" y="0" fill="#FF5A1F" font-size="${options.format === 'story' ? 30 : 26}" font-family="Impact, sans-serif" letter-spacing="2">// RAUS. INS ABENTEUER.</text>
      <text x="0" y="${options.format === 'story' ? 95 : options.format === 'portrait' ? 88 : 86}" fill="${textPrimary}" font-size="${titleFontSize}" font-family="Impact, sans-serif" letter-spacing="2">${escapeXml(mainTitle)}</text>
      <text x="0" y="${options.format === 'story' ? 158 : options.format === 'portrait' ? 144 : 142}" fill="#FF5A1F" font-size="${subFontSize}" font-family="Impact, sans-serif" letter-spacing="1.5">// ${escapeXml(subTitle)}</text>
    </g>

    <!-- Key Facts Grid (Big Bold Cards matching Plakat) -->
    <g transform="translate(96, ${options.format === 'story' ? 540 : options.format === 'portrait' ? 370 : 350})">
      ${factsSvg}
    </g>

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

    <!-- Bottom Action Banner CTA (Unmissable for Mobile Feed & Story) -->
    <g transform="translate(96, ${options.format === 'story' ? 1345 : options.format === 'portrait' ? 1075 : 715})">
      <rect x="0" y="0" width="888" height="${options.format === 'story' ? 270 : options.format === 'portrait' ? 215 : 240}" fill="${isLight ? '#FFFFFF' : cardBg}" stroke="${isLight ? '#111713' : '#FF5A1F'}" stroke-width="3.5" rx="12"/>
      
      <rect x="32" y="26" width="240" height="42" fill="#FF5A1F" rx="4"/>
      <text x="152" y="55" fill="#111713" font-size="22" font-family="Impact, sans-serif" text-anchor="middle" letter-spacing="1">JETZT ANMELDEN</text>

      <text x="32" y="${options.format === 'story' ? 132 : options.format === 'portrait' ? 112 : 122}" fill="${textPrimary}" font-size="${options.format === 'story' ? 46 : 42}" font-family="Impact, sans-serif" letter-spacing="1">PLÄTZE ONLINE SICHERN:</text>
      <text x="32" y="${options.format === 'story' ? 196 : options.format === 'portrait' ? 168 : 182}" fill="#FF5A1F" font-size="${options.format === 'story' ? 60 : 54}" font-family="Impact, sans-serif" letter-spacing="2">${escapeXml(displayDomain.toUpperCase())}</text>
      
      <text x="32" y="${options.format === 'story' ? 238 : options.format === 'portrait' ? 200 : 216}" fill="${isLight ? '#3D453E' : textMuted}" font-size="${options.format === 'story' ? 24 : 21}" font-family="sans-serif" font-weight="bold">Link in Bio anklicken • Alle Infos &amp; Packliste online!</text>

      <!-- Action Arrow Circle Button -->
      <g transform="translate(${888 - 32 - 110}, ${options.format === 'story' ? 80 : options.format === 'portrait' ? 52 : 65})">
        <circle cx="55" cy="55" r="55" fill="#FF5A1F"/>
        <path d="M38 55 L72 55 M60 41 L74 55 L60 69" fill="none" stroke="#111713" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>

    <!-- Footer Copyright Note -->
    <text x="${width / 2}" y="${height - (options.format === 'story' ? 150 : 40)}" fill="${textPrimary}" fill-opacity="${isLight ? '0.85' : '0.6'}" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SMJ Regio Wegweiser • Schönstatt-Mannesjugend • ${displayDomain}</text>
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
  const logoInner = getLogoInner(!isLight)

  const bgColor = isLight ? '#F5EFE1' : '#111713'
  const cardBg = isLight ? '#FFFFFF' : '#182019'
  const textPrimary = isLight ? '#111713' : '#F1EBDD'
  const textMuted = isLight ? '#4A524A' : '#C9BA99'
  const displayDomain = getDisplayDomain(options.targetUrl)

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

    <!-- Background Watermark Logo -->
    <g transform="translate(${options.format === 'story' ? '560, 480' : '600, 240'}) rotate(12) scale(${options.format === 'story' ? '2.8' : '2.3'})" opacity="${isLight ? '0.06' : '0.07'}">
      <svg width="328" height="288" viewBox="0 0 328 288">
        ${logoInner}
      </svg>
    </g>
    
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

    ${renderBrandHeader({ format: options.format, theme: options.theme, categoryLabel: `Teil ${options.slideIndex + 1} / ${options.totalSlides}` })}

    ${
      !isLastSlide
        ? `
    <!-- Title Section -->
    <g transform="translate(96, ${options.format === 'story' ? 340 : 185})">
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
      <text x="32" y="${options.format === 'story' ? 202 : 186}" fill="#FF5A1F" font-size="${options.format === 'story' ? 58 : 52}" font-family="Impact, sans-serif" letter-spacing="2">${escapeXml(displayDomain.toUpperCase())}</text>
      <text x="32" y="${options.format === 'story' ? 250 : 224}" fill="${isLight ? '#3D453E' : textMuted}" font-size="${options.format === 'story' ? 24 : 21}" font-family="sans-serif" font-weight="bold">Kalender als iCal / Google abonnieren: /api/calendar.ics</text>

      <g transform="translate(${888 - 32 - 110}, ${options.format === 'story' ? 95 : 70})">
        <circle cx="55" cy="55" r="55" fill="#FF5A1F"/>
        <path d="M38 55 L72 55 M60 41 L74 55 L60 69" fill="none" stroke="#111713" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>
    `
    }

    <!-- Footer Copyright -->
    <text x="${width / 2}" y="${height - (options.format === 'story' ? 150 : 40)}" fill="${textPrimary}" fill-opacity="${isLight ? '0.85' : '0.6'}" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SMJ Regio Wegweiser • Schönstatt-Mannesjugend • ${displayDomain}</text>
  </svg>`
}

/**
 * Converts an SVG string to a high-resolution PNG Buffer using sharp.
 */
export async function renderSvgToPng(svgString: string): Promise<Buffer> {
  return await sharp(Buffer.from(svgString)).png({ compressionLevel: 8 }).toBuffer()
}
