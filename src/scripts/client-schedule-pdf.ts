import { generateSchedulePdf, type SchedulePdfOptions } from '../lib/pdf/schedule-pdf'

/**
 * Generates and downloads or opens the A6 schedule PDF in the browser.
 */
export async function openOrDownloadClientSchedulePdf(
  options: SchedulePdfOptions,
  mode: 'open' | 'download' = 'open',
): Promise<void> {
  const bytes = await generateSchedulePdf(options)
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const blobUrl = URL.createObjectURL(blob)

  const safeFilename = `SMJ-Terminkarte-${options.periodTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`

  if (mode === 'open') {
    const newTab = window.open(blobUrl, '_blank')
    if (!newTab) {
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = safeFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  } else {
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = safeFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
}
