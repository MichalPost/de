/**
 * Shared batch export layout engine.
 * Platform-specific export functions (download vs Capacitor share) live in each app.
 */
import { renderBarcodeToCanvas } from '../../lib/barcode'
import { canvasToBlob } from '../../lib/utils'
import type { BatchGeneratedRecord } from './types'
import { chunkItems, getBatchBarcodeOptions, resolvePrintMode, type BatchPrintMode } from './layout'

export const MAX_PAGES_PER_PNG = 8

export interface RenderOptions {
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
  globalMode: BatchPrintMode | undefined,
  moduleWidth: number,
  shortModuleWidth: number,
  barcodeHeight: number,
  fontSize: number,
): BarItem[][] {
  return records.map(r => {
    const mode = resolvePrintMode(r, globalMode)
    const items: BarItem[] = []
    if (mode === 'long' || mode === 'both') {
      items.push({
        canvas: renderBarcodeToCanvas(
          r.encodedAscii,
          getBatchBarcodeOptions('exportCanvas', 'long', {
            width: moduleWidth,
            height: barcodeHeight,
            fontSize,
          }),
        ),
        ascii: r.encodedAscii,
      })
    }
    if (mode === 'short' || mode === 'both') {
      items.push({
        canvas: renderBarcodeToCanvas(
          r.shortAscii,
          getBatchBarcodeOptions('exportCanvas', 'short', {
            width: shortModuleWidth,
            height: barcodeHeight,
            fontSize,
          }),
        ),
        ascii: r.shortAscii,
      })
    }
    return items
  })
}

export function renderPagesAsCanvases(opts: RenderOptions): HTMLCanvasElement[] {
  const {
    records, globalMode, cols, perPage,
    moduleWidth = getBatchBarcodeOptions('exportCanvas', 'long').width ?? 3,
    shortModuleWidth = getBatchBarcodeOptions('exportCanvas', 'short').width ?? 4,
    barcodeHeight = getBatchBarcodeOptions('exportCanvas', 'long').height ?? 100,
    pagePaddingPx = 32,
    gapPx = 8,
    fontSize = getBatchBarcodeOptions('exportCanvas', 'long').fontSize ?? 20,
  } = opts

  const pages = chunkItems(records, perPage)

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

export function mergeCanvases(pages: HTMLCanvasElement[]): HTMLCanvasElement {
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

export function addPngSuffix(filename: string, suffix: string): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.png')) return `${filename.slice(0, -4)}${suffix}.png`
  return `${filename}${suffix}`
}

/** Render all records into a single merged canvas, split into chunks if needed. */
export async function renderBatchAsBlobs(
  records: BatchGeneratedRecord[],
  globalMode: 'long' | 'short' | 'both' | undefined,
  cols: number,
  perPage: number,
  filename: string,
): Promise<{ blob: Blob; name: string }[]> {
  const totalPages = Math.max(1, Math.ceil(records.length / perPage))
  const shouldSplit = totalPages > MAX_PAGES_PER_PNG

  if (!shouldSplit) {
    const merged = mergeCanvases(renderPagesAsCanvases({ records, globalMode, cols, perPage }))
    return [{ blob: await canvasToBlob(merged), name: filename }]
  }

  const results: { blob: Blob; name: string }[] = []
  const numChunks = Math.ceil(totalPages / MAX_PAGES_PER_PNG)
  for (let i = 0; i < numChunks; i++) {
    const startPage = i * MAX_PAGES_PER_PNG
    const endPage = Math.min(totalPages, startPage + MAX_PAGES_PER_PNG)
    const chunkRecords = records.slice(startPage * perPage, Math.min(records.length, endPage * perPage))
    const merged = mergeCanvases(renderPagesAsCanvases({ records: chunkRecords, globalMode, cols, perPage }))
    results.push({
      blob: await canvasToBlob(merged),
      name: addPngSuffix(filename, `_p${startPage + 1}-${endPage}`),
    })
  }
  return results
}
