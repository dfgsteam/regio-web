import QRCode from 'qrcode'

export interface QrRenderOptions {
  size?: number
  withLogo?: boolean
  darkColor?: string
  lightColor?: string
  logoSrc?: string
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Renders a high-resolution QR code onto a canvas element with an optional
 * centered SMJ brand logo badge and high error correction (Level H).
 */
export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QrRenderOptions = {},
): Promise<void> {
  const size = options.size || 1024
  const withLogo = options.withLogo !== false
  const darkColor = options.darkColor || '#111713'
  const lightColor = options.lightColor || '#ffffff'
  const logoSrc = options.logoSrc || '/logo.svg'
  const ecLevel = withLogo ? 'H' : options.errorCorrectionLevel || 'M'

  canvas.width = size
  canvas.height = size

  // 1. Render QR matrix to canvas
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: ecLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })

  // 2. Draw centered SMJ logo badge if requested
  if (withLogo) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const logoSize = Math.round(size * 0.22)
      const center = size / 2
      const x = center - logoSize / 2
      const y = center - logoSize / 2
      const radius = Math.round(logoSize * 0.18)

      ctx.save()

      // Outer white buffer / border to ensure high contrast against QR modules
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
      ctx.shadowBlur = Math.round(size * 0.015)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = Math.round(size * 0.005)

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x - 6, y - 6, logoSize + 12, logoSize + 12, radius + 4)
      } else {
        ctx.rect(x - 6, y - 6, logoSize + 12, logoSize + 12)
      }
      ctx.fill()
      ctx.restore()

      // Inner dark container
      ctx.save()
      ctx.fillStyle = '#111713'
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x - 2, y - 2, logoSize + 4, logoSize + 4, radius)
      } else {
        ctx.rect(x - 2, y - 2, logoSize + 4, logoSize + 4)
      }
      ctx.fill()

      // Orange subtle border
      ctx.strokeStyle = '#FF5A1F'
      ctx.lineWidth = Math.max(2, Math.round(size * 0.004))
      ctx.stroke()
      ctx.restore()

      // Draw Logo Image
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.save()
          // Inner padding inside the dark badge
          const pad = Math.round(logoSize * 0.12)
          ctx.drawImage(img, x + pad, y + pad, logoSize - pad * 2, logoSize - pad * 2)
          ctx.restore()
          resolve()
        }
        img.onerror = () => {
          // Fallback if image fails: draw stylized SMJ text
          ctx.save()
          ctx.fillStyle = '#FF5A1F'
          ctx.font = `bold ${Math.round(logoSize * 0.25)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('SMJ', center, center)
          ctx.restore()
          resolve()
        }
        img.src = logoSrc
      })
    }
  }
}

/**
 * Downloads a canvas as a PNG file.
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  const cleanName = filename.endsWith('.png') ? filename : `${filename}.png`
  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = cleanName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
