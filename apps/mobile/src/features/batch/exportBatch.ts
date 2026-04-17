import { renderBarcodeToCanvas } from '@chemtools/shared/lib/barcode'
import type { BatchGeneratedRecord } from './types'

export const MAX_PAGES_PER_PNG = 8

// ─── Layout engine ────────────────────────────────────────────────────────────

interface RenderOptions {
  records: BatchGeneratedRecord[]
  globalMode?: 'long' | 'short' | 'both'
  cols: number
  perPage: number
  moduleWidth?: number
  shortModuleWidth?: number
  barcodeHeight?: number
  pagePaddingPx?: number
  gapPx?: number
  fontSize?: number
}

type BarItem = { canvas: HTMLCanvasElement; ascii: string }

function buildPageItems(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  moduleWidth: number,
  shortModuleWidth: number,
  barcodeHeight: number,
  fontSize: number,
): BarItem[][] {
  return records.map(r => {
    const mode = globalMode ?? r.printMode
    const items: BarItem[] = []
    if (mode === 'long' || mode === 'both') {
      items.push({
        canvas: renderBarcodeToCanvas(r.encodedAscii, { width: moduleWidth, height: barcodeHeight, fontSize, margin: 12 }),
        ascii: r.encodedAscii,
      })
    }
    if (mode === 'short' || mode === 'both') {
      items.push({
        canvas: renderBarcodeToCanvas(r.shortAscii, { width: shortModuleWidth, height: barcodeHeight, fontSize, margin: 12 }),
        ascii: r.shortAscii,
      })
    }
    return items
  })
}

function renderPagesAsCanvases(opts: RenderOptions): HTMLCanvasElement[] {
  const {
    records, globalMode, cols, perPage,
    moduleWidth = 3,
    shortModuleWidth = 4,
    barcodeHeight = 100,
    pagePaddingPx = 32,
    gapPx = 8,
    fontSize = 20,
  } = opts

  const pages: BatchGeneratedRecord[][] = []
  for (let i = 0; i < records.length; i += perPage) pages.push(records.slice(i, i + perPage))

  return pages.map(pageRecords => {
    const allItems = buildPageItems(pageRecords, globalMode, moduleWidth, shortModuleWidth, barcodeHeight, fontSize)

    const cellW = Math.max(...allItems.flat().map(b => b.canvas.width), 1)
    const cellH = allItems.reduce((max, bars) =>
      Math.max(max, bars.reduce((s, b) => s + b.canvas.height + 6, 0)), 0)

    const rows = Math.ceil(pageRecords.length / cols)
    const pageW = pagePaddingPx * 2 + cols * cellW + (cols - 1) * gapPx
    const pageH = pagePaddingPx * 2 + rows * cellH + (rows - 1) * gapPx

    const canvas = document.createElement('canvas')
    canvas.width = pageW
    canvas.height = pageH
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageW, pageH)

    pageRecords.forEach((_, ri) => {
      const col = ri % cols
      const row = Math.floor(ri / cols)
      const cellX = pagePaddingPx + col * (cellW + gapPx)
      const cellY = pagePaddingPx + row * (cellH + gapPx)
      let y = cellY

      allItems[ri].forEach(item => {
        const offsetX = cellX + Math.round((cellW - item.canvas.width) / 2)
        ctx.drawImage(item.canvas, offsetX, y)
        y += item.canvas.height + 6
      })
    })

    return canvas
  })
}

function mergeCanvases(pages: HTMLCanvasElement[]): HTMLCanvasElement {
  const totalH = pages.reduce((s, c) => s + c.height, 0)
  const maxW = Math.max(...pages.map(c => c.width))
  const merged = document.createElement('canvas')
  merged.width = maxW
  merged.height = totalH
  const ctx = merged.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, maxW, totalH)
  let y = 0
  for (const p of pages) {
    ctx.drawImage(p, Math.round((maxW - p.width) / 2), y)
    y += p.height
  }
  return merged
}

function addPngSuffix(filename: string, suffix: string) {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.png')) return `${filename.slice(0, -4)}${suffix}.png`
  return `${filename}${suffix}`
}

/** Convert blob to base64 string (without data: prefix) */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip "data:...;base64," prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Save a blob to device storage via Capacitor and share/open it */
async function saveAndShareBlob(blob: Blob, filename: string): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')

  const base64 = await blobToBase64(blob)
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })

  await Share.share({
    title: filename,
    url: result.uri,
    dialogTitle: '保存或分享文件',
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function exportResultsAsPng(
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
    const blob = await new Promise<Blob>((res, rej) =>
      merged.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
    )
    await saveAndShareBlob(blob, filename)
    return
  }

  const numChunks = Math.ceil(totalPages / MAX_PAGES_PER_PNG)
  for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
    const startPage = chunkIndex * MAX_PAGES_PER_PNG
    const endPageExclusive = Math.min(totalPages, startPage + MAX_PAGES_PER_PNG)
    const startRecord = startPage * perPage
    const endRecord = Math.min(records.length, endPageExclusive * perPage)
    const chunkRecords = records.slice(startRecord, endRecord)

    const pages = renderPagesAsCanvases({ records: chunkRecords, globalMode, cols, perPage })
    const merged = mergeCanvases(pages)
    const blob = await new Promise<Blob>((res, rej) =>
      merged.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
    )
    const outName = addPngSuffix(filename, `_p${startPage + 1}-${endPageExclusive}`)
    await saveAndShareBlob(blob, outName)
  }
}

/** 复制图片：Android 不支持 Clipboard API，改用系统分享 */
export async function copyResultsAsImage(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
): Promise<void> {
  const pages = renderPagesAsCanvases({ records, globalMode, cols, perPage })
  const merged = mergeCanvases(pages)
  const blob = await new Promise<Blob>((res, rej) =>
    merged.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
  )
  await saveAndShareBlob(blob, `条码_${Date.now()}.png`)
}

/** PDF 导出：通过 Capacitor Filesystem + Share 保存到设备 */
export async function exportResultsAsPdf(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
  templateName: string,
): Promise<void> {
  const { pdf } = await import('@react-pdf/renderer')
  const { createElement } = await import('react')
  const { BatchPdfDocument } = await import('./BatchPdfDocument')

  const doc = createElement(BatchPdfDocument, { records, globalMode, cols, perPage })
  const blob = await pdf(doc).toBlob()

  const filename = `批量生成_${templateName}_${new Date().toISOString().slice(0, 10)}.pdf`
  await saveAndShareBlob(blob, filename)
}
