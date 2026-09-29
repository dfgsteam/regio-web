const configuredQrBaseUrl = import.meta.env.PUBLIC_QR_BASE_URL?.trim() || 'https://smj-wegweiser.de'
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
  throw new Error('PUBLIC_QR_BASE_URL muss eine HTTP(S)-Domain ohne Pfad oder Parameter sein.')
}

export const QR_BASE_URL = parsedQrBaseUrl.origin
