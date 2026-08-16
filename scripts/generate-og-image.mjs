/**
 * Generates the default OpenGraph image (1200x630 PNG) with the official logo emblem.
 * Regenerate with: node scripts/generate-og-image.mjs
 */
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'public', 'og-image.png')
const logoFile = join(root, 'public', 'logo_wegweiser_white.svg')

const W = 1200
const H = 630

// Read logo SVG content and strip outer <svg> tag for clean embedding
const logoRaw = readFileSync(logoFile, 'utf-8')
const logoContent = logoRaw
  .replace(/<\?xml.*?\?>/i, '')
  .replace(/<!DOCTYPE.*?>/i, '')
  .replace(/<svg[^>]*>/i, '')
  .replace(/<\/svg>/i, '')

const topo = (cx, cy, r0) => {
  const rings = []
  for (let i = 1; i <= 6; i++) {
    const r = r0 * (i / 6)
    rings.push(
      `<ellipse cx="${cx}" cy="${cy}" rx="${(r * 1.55).toFixed(1)}" ry="${r.toFixed(1)}" transform="rotate(-8 ${cx} ${cy})"/>`,
    )
  }
  return rings.join('\n')
}

const crosshair = (x, y, size = 26) =>
  `<path d="M${x - size} ${y}H${x + size}M${x} ${y - size}V${y + size}" stroke="#FF5A1F" stroke-width="3"/>` +
  `<circle cx="${x}" cy="${y}" r="3" fill="#FF5A1F"/>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#FF5A1F" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Dark Forest Background -->
  <rect width="${W}" height="${H}" fill="#111713"/>

  <!-- Topographic Contour Lines -->
  <g fill="none" stroke="#223023" stroke-width="2.5">
${topo(280, 240, 560)}
  </g>
  <g fill="none" stroke="#2B3D2C" stroke-width="2">
${topo(960, 340, 520)}
  </g>

  <!-- Technical Accents & Frame -->
  ${crosshair(56, 56)}
  ${crosshair(W - 56, H - 56)}
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#FF5A1F" stroke-width="3"/>

  <!-- Top Technical Header -->
  <g transform="translate(72, 92)">
    <circle cx="6" cy="6" r="5" fill="#FF5A1F"/>
    <text x="24" y="11" font-family="'DejaVu Sans Mono', 'Courier New', monospace" font-size="18" font-weight="bold" letter-spacing="4" fill="#FF5A1F">// SMJ REGIO WEGWEISER</text>
    <text x="760" y="11" font-family="'DejaVu Sans Mono', 'Courier New', monospace" font-size="14" letter-spacing="2" fill="#8D9389">N 51° 21' 15" · E 10° 02' 30"</text>
  </g>

  <!-- Main Headline -->
  <g transform="translate(72, 0)">
    <text x="0" y="270" font-family="'DejaVu Sans', 'Arial Black', Impact, sans-serif" font-weight="900" font-size="108" fill="#F1EBDD" letter-spacing="-2">RAUS.</text>
    <text x="0" y="375" font-family="'DejaVu Sans', 'Arial Black', Impact, sans-serif" font-weight="900" font-size="108" fill="#FF5A1F" letter-spacing="-2">INS</text>
    <text x="0" y="480" font-family="'DejaVu Sans', 'Arial Black', Impact, sans-serif" font-weight="900" font-size="108" fill="#F1EBDD" letter-spacing="-2">ABENTEUER.</text>
  </g>

  <!-- Embedded Official Logo Emblem (Right Column) -->
  <g transform="translate(750, 140) scale(1.15)" filter="url(#glow)">
    ${logoContent}
  </g>

  <!-- Bottom Badges & Footer -->
  <line x1="72" y1="520" x2="${W - 72}" y2="520" stroke="#F1EBDD" stroke-opacity="0.15" stroke-width="1.5"/>
  <text x="72" y="565" font-family="'DejaVu Sans Mono', 'Courier New', monospace" font-size="16" letter-spacing="3" fill="#8D9389">ZELTLAGER · GEMEINSCHAFT · ABENTEUER FÜR JUNGS</text>
  <text x="${W - 72}" y="565" text-anchor="end" font-family="'DejaVu Sans Mono', 'Courier New', monospace" font-size="16" font-weight="bold" letter-spacing="3" fill="#FF5A1F">SMJ-WEGWEISER.DE ↗</text>
</svg>
`

const { default: sharp } = await import('sharp')
mkdirSync(dirname(outFile), { recursive: true })
await sharp(Buffer.from(svg)).png().toFile(outFile)
console.log('Successfully generated OpenGraph image with logo:', outFile)
