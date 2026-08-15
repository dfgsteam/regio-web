/**
 * Generates the default OpenGraph image (1200x630 PNG).
 * Regenerate with: node scripts/generate-og-image.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'public', 'og-image.png')

const W = 1200
const H = 630

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
  <rect width="${W}" height="${H}" fill="#111713"/>
  <g fill="none" stroke="#2E3B2C" stroke-width="3">
${topo(360, 300, 620)}
  </g>
  <g fill="none" stroke="#3A4A37" stroke-width="2">
${topo(960, 480, 480)}
  </g>
  ${crosshair(56, 56)}
  ${crosshair(W - 56, H - 56)}
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="#FF5A1F" stroke-width="4"/>

  <text x="72" y="110" font-family="'DejaVu Sans Mono', monospace" font-size="22" letter-spacing="6" fill="#FF5A1F">SMJ REGIO WEGWEISER</text>
  <text x="72" y="360" font-family="'DejaVu Sans', 'Arial', sans-serif" font-weight="bold" font-size="120" fill="#F1EBDD">RAUS.</text>
  <text x="72" y="480" font-family="'DejaVu Sans', 'Arial', sans-serif" font-weight="bold" font-size="120" fill="#FF5A1F">INS ABENTEUER.</text>
  <text x="72" y="566" font-family="'DejaVu Sans Mono', monospace" font-size="20" letter-spacing="4" fill="#8D9389">ZELTLAGER · LAGERFEUER · WETTKÄMPFE · FREUNDE</text>
  <text x="1128" y="566" text-anchor="end" font-family="'DejaVu Sans Mono', monospace" font-size="20" letter-spacing="4" fill="#8D9389">SMJ-WEGWEISER.DE</text>
</svg>
`

const { default: sharp } = await import('sharp')
mkdirSync(dirname(outFile), { recursive: true })
await sharp(Buffer.from(svg)).png().toFile(outFile)
console.log('wrote', outFile)
