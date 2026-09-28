import QRCode from 'qrcode'

export interface QrRenderOptions {
  size?: number
  darkColor?: string
  lightColor?: string
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Renders a crisp, high-resolution QR code onto a canvas element.
 */
export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QrRenderOptions = {},
): Promise<void> {
  const size = options.size || 1024
  const darkColor = options.darkColor || '#000000'
  const lightColor = options.lightColor || '#ffffff'
  const margin = options.margin ?? 2
  const ecLevel = options.errorCorrectionLevel || 'M'

  canvas.width = size
  canvas.height = size

  // Render pure QR matrix to canvas
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin,
    errorCorrectionLevel: ecLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })
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
