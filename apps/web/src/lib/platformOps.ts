import type { PlatformOps } from '@chemtools/shared/lib/platformOps'
import { renderBarcodeToCanvas, downloadBarcodePng, openBarcodePrintView } from '@chemtools/shared/lib/barcode'
import { downloadBlob } from '@chemtools/shared/lib/utils'
import {
  exportResultsAsPng,
  copyResultsAsImage,
  exportResultsAsPdf,
  exportSingleBarcodePdf,
  MAX_PAGES_PER_PNG,
} from '../features/batch/exportBatch'

async function copyBarcodeAsPng(ascii: string, isShort = false): Promise<void> {
  const canvas = renderBarcodeToCanvas(ascii, {
    width: isShort ? 4 : 3,
    height: 120,
    fontSize: 18,
    margin: 14,
  })
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
  )
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export const webPlatformOps: PlatformOps = {
  copyBarcodeAsPng,
  downloadBarcodePng: (ascii, filename) => downloadBarcodePng(ascii, filename),
  openBarcodePrintView: (ascii, title) => { openBarcodePrintView(ascii, title ?? '条码打印'); return Promise.resolve() },
  exportJsonFile: (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, filename)
    return Promise.resolve()
  },
  readFileAsBlob: (file) => Promise.resolve(file),
  exportBatchAsPng: exportResultsAsPng,
  copyBatchAsImage: copyResultsAsImage,
  exportBatchAsPdf: exportResultsAsPdf,
  exportSingleBarcodePdf,
  maxPagesPerPng: MAX_PAGES_PER_PNG,
}
