/**
 * Generates placeholder SVGs for image slots until real photography arrives.
 * Regenerate with: node scripts/generate-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'placeholders')

const slots = [
  { name: 'hero', width: 2400, height: 1600, ratio: '3:2', accent: '#FF5A1F', label: 'HERO SLOT' },
  { name: 'story', width: 1200, height: 1500, ratio: '4:5', accent: '#C9BA99', label: 'STORY SLOT' },
  { name: 'reel', width: 2000, height: 1200, ratio: '5:3', accent: '#FF5A1F', label: 'REEL SLOT' },
  { name: 'journal-landscape', width: 1920, height: 1200, ratio: '16:10', accent: '#8D9389', label: 'JOURNAL 16:10' },
  { name: 'journal-portrait', width: 1200, height: 1500, ratio: '4:5', accent: '#8D9389', label: 'JOURNAL 4:5' },
  { name: 'camp-hero', width: 2400, height: 1350, ratio: '16:9', accent: '#E2A93B', label: 'CAMP HERO' },
  { name: 'wide', width: 2400, height: 900, ratio: '8:3', accent: '#FF5A1F', label: 'PANORAMA SLOT' },
  { name: 'portrait', width: 1200, height: 1500, ratio: '4:5', accent: '#C9BA99', label: 'PORTRAIT SLOT' },
  { name: 'group', width: 2400, height: 1350, ratio: '16:9', accent: '#C9BA99', label: 'GROUP SLOT' },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

function topoEllipses(w, h, cx, cy) {
  const parts = []
  const base = Math.min(w, h) / 2
  for (let i = 1; i <= 7; i++) {
    const r = (base / 7.5) * i
    parts.push(
      `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.55}" ry="${r}" transform="rotate(-8 ${cx} ${cy})"/>`,
    )
  }
  return parts.join('\n')
}

function crosshair(x, y, accent, size = 26) {
  return [
    `<path d="M${x - size} ${y}H${x + size}M${x} ${y - size}V${y + size}" stroke="${accent}" stroke-width="2"/>`,
    `<circle cx="${x}" cy="${y}" r="2.5" fill="${accent}"/>`,
  ].join('\n')
}

for (const slot of slots) {
  const { width: w, height: h, ratio, accent, label, name } = slot
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#182019"/>
  <g fill="none" stroke="#2E3B2C" stroke-width="2" opacity="0.85">
${topoEllipses(w, h, w * 0.66, h * 0.42)}
  </g>
  <g fill="none" stroke="#3A4A37" stroke-width="1.4" opacity="0.7">
${topoEllipses(w, h, w * 0.24, h * 0.68)}
  </g>
  ${crosshair(48, 48, accent)}
  ${crosshair(w - 48, h - 48, accent)}
  <g font-family="'Space Mono', 'Courier New', monospace" fill="${accent}" font-size="${Math.round(h / 22)}" letter-spacing="4">
    <text x="${w * 0.06}" y="${h * 0.5}">${esc(label)}</text>
    <text x="${w * 0.06}" y="${h * 0.5 + Math.round(h / 12)}" opacity="0.55">${ratio} — ${w}×${h}</text>
  </g>
  <g font-family="'Space Mono', 'Courier New', monospace" fill="#8D9389" font-size="${Math.round(h / 34)}" letter-spacing="3">
    <text x="${w * 0.06}" y="${h * 0.5 + Math.round(h / 6)}">BILD FOLGT.</text>
    <text x="${w * 0.06}" y="${h * 0.5 + Math.round(h / 6) + Math.round(h / 22)}">WIRD DURCH ECHTES FOTO ERSETZT.</text>
  </g>
</svg>
`
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, `${name}.svg`), svg)
  console.log(`wrote ${name}.svg`)
}
