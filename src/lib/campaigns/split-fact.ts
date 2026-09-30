/**
 * Splits fact strings (WANN, WO, WER) into two concise lines
 * matching the visual hierarchy of the poster design.
 */
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

  const words = u.split(/\s+/)
  if (words.length <= 1) return [u, '']
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}
