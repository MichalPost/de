import type * as React from 'react'
import { formatFileTimestamp } from '@chemtools/shared/lib/utils'
import {
  MAX_PAGES_PER_PNG,
  renderPagesAsCanvases,
  mergeCanvases,
  addPngSuffix,
  renderBatchAsBlobs,
} from '@chemtools/shared/features/batch/exportBatch'
import type { BatchGeneratedRecord } from './types'

export { MAX_PAGES_PER_PNG, renderPagesAsCanvases, mergeCanvases, addPngSuffix }

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export async function exportResultsAsPng(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
  filename: string,
): Promise<void> {
  const chunks = await renderBatchAsBlobs(records, globalMode, cols, perPage, filename)
  for (const { blob, name } of chunks) downloadBlob(blob, name)
}

export async function copyResultsAsImage(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
): Promise<void> {
  const { canvasToBlob } = await import('@chemtools/shared/lib/utils')
  const merged = mergeCanvases(renderPagesAsCanvases({ records, globalMode, cols, perPage }))
  const blob = await canvasToBlob(merged)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export async function exportResultsAsPdf(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
  _templateName: string,
  scale = 72,
): Promise<void> {
  const { pdf } = await import('@react-pdf/renderer')
  type DocumentProps = import('@react-pdf/renderer').DocumentProps
  const { createElement } = await import('react')
  const { BatchPdfDocument } = await import('./BatchPdfDocument')
  const doc = createElement(BatchPdfDocument, { records, globalMode, cols, perPage, scale }) as React.ReactElement<DocumentProps>
  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `${formatFileTimestamp()}.pdf`)
}

export async function exportSingleBarcodePdf(
  encodedAscii: string,
  shortAscii: string,
  _filename: string,
  mode: 'long' | 'short' | 'both' = 'both',
  scale = 72,
): Promise<void> {
  const record: BatchGeneratedRecord = {
    index: 1, reagentId: 0, serialNumber: 0, agentId: 0, customerId: 0,
    payloadHex: '', encodedAscii, encodedHex: '', shortAscii, shortHex: '',
    longSvg: '', shortSvg: '', printMode: mode,
  }
  const { pdf } = await import('@react-pdf/renderer')
  type DocumentProps = import('@react-pdf/renderer').DocumentProps
  const { createElement } = await import('react')
  const { BatchPdfDocument } = await import('./BatchPdfDocument')
  const doc = createElement(BatchPdfDocument, { records: [record], globalMode: mode, cols: 1, perPage: 1, scale }) as React.ReactElement<DocumentProps>
  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `${formatFileTimestamp()}.pdf`)
}
