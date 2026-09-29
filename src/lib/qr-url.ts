const configuredQrBaseUrl = import.meta.env.SITE
const parsedQrBaseUrl = new URL(configuredQrBaseUrl)

if (
  !['http:', 'https:'].includes(parsedQrBaseUrl.protocol) ||
  parsedQrBaseUrl.origin === 'null' ||
  parsedQrBaseUrl.username ||
  parsedQrBaseUrl.password ||
  parsedQrBaseUrl.pathname !== '/' ||
  parsedQrBaseUrl.search ||
  parsedQrBaseUrl.hash
) {
  throw new Error('SITE_URL muss eine HTTP(S)-Domain ohne Pfad oder Parameter sein.')
}

export const QR_BASE_URL = parsedQrBaseUrl.origin
