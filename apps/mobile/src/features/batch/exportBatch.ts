import type * as React from 'react'
import { formatFileTimestamp, blobToBase64 } from '@chemtools/shared/lib/utils'
import {
  MAX_PAGES_PER_PNG,
  renderPagesAsCanvases,
  mergeCanvases,
  renderBatchAsBlobs,
} from '@chemtools/shared/features/batch/exportBatch'
import type { BatchGeneratedRecord } from './types'

export { MAX_PAGES_PER_PNG }

async function saveAndShareBlob(blob: Blob, filename: string): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const base64 = await blobToBase64(blob)
  const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache })
  await Share.share({ title: filename, url: result.uri, dialogTitle: '保存或分享文件' })
}

export async function exportResultsAsPng(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
  filename: string,
): Promise<void> {
  const chunks = await renderBatchAsBlobs(records, globalMode, cols, perPage, filename)
  for (const { blob, name } of chunks) await saveAndShareBlob(blob, name)
}

/** 复制图片：Android 不支持 Clipboard API，改用系统分享 */
export async function copyResultsAsImage(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
): Promise<void> {
  const { canvasToBlob } = await import('@chemtools/shared/lib/utils')
  const merged = mergeCanvases(renderPagesAsCanvases({ records, globalMode, cols, perPage }))
  const blob = await canvasToBlob(merged)
  await saveAndShareBlob(blob, `条码_${Date.now()}.png`)
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
  await saveAndShareBlob(blob, `${formatFileTimestamp()}.pdf`)
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
  await saveAndShareBlob(blob, `${formatFileTimestamp()}.pdf`)
}
