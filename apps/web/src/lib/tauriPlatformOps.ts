/**
 * Tauri-specific PlatformOps implementation.
 * Uses @tauri-apps/plugin-dialog for save dialogs and
 * @tauri-apps/plugin-fs for writing files to disk.
 */
import type { PlatformOps } from '@chemtools/shared/lib/platformOps'
import { renderBarcodeToCanvas } from '@chemtools/shared/lib/barcode'
import { formatFileTimestamp, canvasToBlob } from '@chemtools/shared/lib/utils'
import {
  copyResultsAsImage,
  MAX_PAGES_PER_PNG,
  renderPagesAsCanvases,
  mergeCanvases,
  addPngSuffix,
} from '../features/batch/exportBatch'
import type { BatchGeneratedRecord } from '../features/batch/types'

// ─── Lazy-loaded module cache ─────────────────────────────────────────────────

let _tauriDialog: typeof import('@tauri-apps/plugin-dialog') | undefined
let _tauriFs: typeof import('@tauri-apps/plugin-fs') | undefined
let _reactPdf: typeof import('@react-pdf/renderer') | undefined
let _batchPdfDocument: typeof import('@chemtools/shared/features/batch/BatchPdfDocument') | undefined

async function getTauriDialog() {
  return (_tauriDialog ??= await import('@tauri-apps/plugin-dialog'))
}
async function getTauriFs() {
  return (_tauriFs ??= await import('@tauri-apps/plugin-fs'))
}
async function getReactPdf() {
  return (_reactPdf ??= await import('@react-pdf/renderer'))
}
async function getBatchPdfDocument() {
  return (_batchPdfDocument ??= await import('@chemtools/shared/features/batch/BatchPdfDocument'))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

/** Show a save dialog and write bytes to the chosen path. */
async function saveFileDialog(
  defaultName: string,
  filters: { name: string; extensions: string[] }[],
  data: Uint8Array,
): Promise<void> {
  const { save } = await getTauriDialog()
  const { writeFile } = await getTauriFs()
  const path = await save({ defaultPath: defaultName, filters })
  if (!path) return // user cancelled
  await writeFile(path, data)
}

// ─── Tauri implementations ────────────────────────────────────────────────────

async function tauriDownloadBarcodePng(ascii: string, filename: string): Promise<void> {
  const canvas = renderBarcodeToCanvas(ascii, { width: 3, height: 120, fontSize: 18, margin: 14 })
  const blob = await canvasToBlob(canvas)
  await saveFileDialog(filename, [{ name: 'PNG 图片', extensions: ['png'] }], await blobToUint8Array(blob))
}

async function tauriExportJsonFile(data: unknown, filename: string): Promise<void> {
  const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2))
  await saveFileDialog(filename, [{ name: 'JSON 文件', extensions: ['json'] }], bytes)
}

async function tauriExportBatchAsPng(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
  filename: string,
): Promise<void> {
  const totalPages = Math.max(1, Math.ceil(records.length / perPage))
  const shouldSplit = totalPages > MAX_PAGES_PER_PNG

  if (!shouldSplit) {
    const pages = renderPagesAsCanvases({ records, globalMode, cols, perPage })
    const merged = mergeCanvases(pages)
    await saveFileDialog(filename, [{ name: 'PNG 图片', extensions: ['png'] }], await blobToUint8Array(await canvasToBlob(merged)))
    return
  }

  const numChunks = Math.ceil(totalPages / MAX_PAGES_PER_PNG)
  for (let i = 0; i < numChunks; i++) {
    const startPage = i * MAX_PAGES_PER_PNG
    const endPage = Math.min(totalPages, startPage + MAX_PAGES_PER_PNG)
    const chunkRecords = records.slice(startPage * perPage, Math.min(records.length, endPage * perPage))
    const pages = renderPagesAsCanvases({ records: chunkRecords, globalMode, cols, perPage })
    const merged = mergeCanvases(pages)
    const outName = addPngSuffix(filename, `_p${startPage + 1}-${endPage}`)
    await saveFileDialog(outName, [{ name: 'PNG 图片', extensions: ['png'] }], await blobToUint8Array(await canvasToBlob(merged)))
  }
}

/** Render a React-PDF document element to a PDF file via save dialog. */
async function savePdfDocument(doc: React.ReactElement): Promise<void> {
  const { pdf } = await getReactPdf()
  const blob = await pdf(doc).toBlob()
  const filename = `${formatFileTimestamp()}.pdf`
  await saveFileDialog(filename, [{ name: 'PDF 文件', extensions: ['pdf'] }], await blobToUint8Array(blob))
}

async function tauriExportBatchAsPdf(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
  _templateName: string,
  scale = 72,
): Promise<void> {
  type DocumentProps = import('@react-pdf/renderer').DocumentProps
  const { createElement } = await import('react')
  const { BatchPdfDocument } = await getBatchPdfDocument()
  const doc = createElement(BatchPdfDocument, { records, globalMode, cols, perPage, scale }) as React.ReactElement<DocumentProps>
  await savePdfDocument(doc)
}

async function tauriExportSingleBarcodePdf(
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
  type DocumentProps = import('@react-pdf/renderer').DocumentProps
  const { createElement } = await import('react')
  const { BatchPdfDocument } = await getBatchPdfDocument()
  const doc = createElement(BatchPdfDocument, { records: [record], globalMode: mode, cols: 1, perPage: 1, scale }) as React.ReactElement<DocumentProps>
  await savePdfDocument(doc)
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const tauriPlatformOps: PlatformOps = {
  copyBarcodeAsPng: async (ascii, isShort = false) => {
    const canvas = renderBarcodeToCanvas(ascii, {
      width: isShort ? 4 : 3, height: 120, fontSize: 18, margin: 14,
    })
    const blob = await canvasToBlob(canvas)
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  },
  downloadBarcodePng: tauriDownloadBarcodePng,
  openBarcodePrintView: async (ascii, title) => {
    // Tauri 没有 window.open 打印，改为保存 PNG
    await tauriDownloadBarcodePng(ascii, `${title ?? 'barcode'}.png`)
  },
  exportJsonFile: tauriExportJsonFile,
  readFileAsBlob: (file) => Promise.resolve(file),
  exportBatchAsPng: tauriExportBatchAsPng,
  copyBatchAsImage: copyResultsAsImage,
  exportBatchAsPdf: tauriExportBatchAsPdf,
  exportSingleBarcodePdf: tauriExportSingleBarcodePdf,
  maxPagesPerPng: MAX_PAGES_PER_PNG,
}
