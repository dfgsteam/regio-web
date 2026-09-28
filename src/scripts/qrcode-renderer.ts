import QRCode from 'qrcode'

export interface QrOptions {
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  darkColor?: string
  lightColor?: string
}

/**
 * Generates an SVG string representation of a pure, crisp QR code.
 */
export async function generateQrSvg(text: string, options: QrOptions = {}): Promise<string> {
  return await QRCode.toString(text, {
    type: 'svg',
    margin: options.margin ?? 2,
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'M',
    color: {
      dark: options.darkColor || '#000000',
      light: options.lightColor || '#ffffff',
    },
  })
}

/**
 * Generates a high-res PNG data URL of a QR code.
 */
export async function generateQrDataUrl(
  text: string,
  width = 1024,
  options: QrOptions = {},
): Promise<string> {
  return await QRCode.toDataURL(text, {
    width,
    margin: options.margin ?? 2,
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'M',
    color: {
      dark: options.darkColor || '#000000',
      light: options.lightColor || '#ffffff',
    },
  })
}

/**
 * Triggers a direct download of a QR code PNG file.
 */
export async function downloadQrPng(
  text: string,
  filename: string,
  width = 1024,
  options: QrOptions = {},
): Promise<void> {
  const cleanName = filename.endsWith('.png') ? filename : `${filename}.png`
  const dataUrl = await generateQrDataUrl(text, width, options)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = cleanName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
