import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

let isConfigured = false

/**
 * Ensures that fontconfig is configured so librsvg (used by Sharp) can find
 * our bundled brand fonts (Anton, Inter, Space Mono, Caveat) regardless of the
 * host operating system (Linux server, Docker container, macOS, etc.).
 */
export function ensureServerFontsConfigured(): void {
  if (isConfigured) return

  try {
    const fontDirs: string[] = []

    // 1. Primary assets/fonts path
    const candidateDirs = [
      path.resolve(process.cwd(), 'src/assets/fonts'),
      fileURLToPath(new URL('../../assets/fonts', import.meta.url)),
      path.resolve(process.cwd(), 'dist/assets/fonts'),
    ]

    for (const d of candidateDirs) {
      if (fs.existsSync(d) && !fontDirs.includes(d)) {
        fontDirs.push(d)
      }
    }

    // 2. Also add fontsource packages if available in node_modules
    const nodeModulesFonts = [
      path.resolve(process.cwd(), 'node_modules/@fontsource/anton/files'),
      path.resolve(process.cwd(), 'node_modules/@fontsource-variable/inter/files'),
      path.resolve(process.cwd(), 'node_modules/@fontsource/space-mono/files'),
    ]
    for (const d of nodeModulesFonts) {
      if (fs.existsSync(d) && !fontDirs.includes(d)) {
        fontDirs.push(d)
      }
    }

    // 3. Fallback system font directories
    const systemDirs = [
      '/usr/share/fonts',
      '/usr/local/share/fonts',
      '/Library/Fonts',
      '/System/Library/Fonts',
    ]
    for (const d of systemDirs) {
      if (fs.existsSync(d) && !fontDirs.includes(d)) {
        fontDirs.push(d)
      }
    }

    if (fontDirs.length === 0) {
      return
    }

    // Create a temporary fontconfig directory
    const fcDir = path.join(os.tmpdir(), 'smj-fontconfig')
    fs.mkdirSync(fcDir, { recursive: true })
    const cacheDir = path.join(os.tmpdir(), 'smj-fc-cache')
    fs.mkdirSync(cacheDir, { recursive: true })

    const dirTags = fontDirs.map((dir) => `  <dir>${dir}</dir>`).join('\n')

    const xml = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
${dirTags}
  <cachedir>${cacheDir}</cachedir>
  
  <!-- Map Impact to Anton for expedition headlines -->
  <match target="pattern">
    <test name="family"><string>Impact</string></test>
    <edit name="family" mode="assign" binding="strong"><string>Anton</string></edit>
  </match>

  <!-- Prefer Inter for sans-serif on servers without Apple/Windows fonts -->
  <match target="pattern">
    <test name="family"><string>sans-serif</string></test>
    <edit name="family" mode="prepend" binding="strong"><string>Inter</string></edit>
  </match>

  <!-- Prefer Space Mono for monospace -->
  <match target="pattern">
    <test name="family"><string>monospace</string></test>
    <edit name="family" mode="prepend" binding="strong"><string>Space Mono</string></edit>
  </match>
</fontconfig>`

    fs.writeFileSync(path.join(fcDir, 'fonts.conf'), xml, 'utf-8')
    process.env.FONTCONFIG_PATH = fcDir
    isConfigured = true
  } catch (err) {
    // Non-fatal fallback: proceed with system fonts
    console.warn('[server-fonts] Could not configure custom Fontconfig:', err)
  }
}

// Auto-run on import
ensureServerFontsConfigured()
