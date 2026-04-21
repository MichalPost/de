import type { BarcodeOptions } from '../../lib/barcode'
import type { BatchGeneratedRecord } from './types'

export type BatchPrintMode = 'long' | 'short' | 'both'
export type BatchBarcodeKind = 'long' | 'short'
export type BatchBarcodePreset = 'resultCard' | 'print' | 'pdf' | 'exportCanvas'

export const PDF_PAGE_PADDING = 18
export const PDF_ROW_GAP = 10
export const PDF_COL_GAP = 16
export const PDF_A4_HEIGHT = 842
export const PDF_PAGE_SAFE_BOTTOM = 12
export const PDF_USABLE_PAGE_HEIGHT = PDF_A4_HEIGHT - PDF_PAGE_PADDING * 2 - PDF_PAGE_SAFE_BOTTOM

const BATCH_BARCODE_OPTIONS: Record<BatchBarcodePreset, Record<BatchBarcodeKind, BarcodeOptions>> = {
  resultCard: {
    long: { width: 1.4, height: 64, margin: 6 },
    short: { width: 2, height: 64, margin: 6 },
  },
  print: {
    long: { width: 1.6, height: 72, margin: 10 },
    short: { width: 2.2, height: 72, margin: 10 },
  },
  pdf: {
    long: { width: 2.4, height: 112, margin: 2 },
    short: { width: 3.2, height: 112, margin: 2 },
  },
  exportCanvas: {
    long: { width: 3, height: 100, fontSize: 20, margin: 12 },
    short: { width: 4, height: 100, fontSize: 20, margin: 12 },
  },
}

export function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export function resolvePrintMode(
  record: BatchGeneratedRecord,
  globalMode?: BatchPrintMode,
): BatchPrintMode {
  return globalMode ?? record.printMode
}

export function getBatchBarcodeOptions(
  preset: BatchBarcodePreset,
  kind: BatchBarcodeKind,
  overrides: BarcodeOptions = {},
): BarcodeOptions {
  return { ...BATCH_BARCODE_OPTIONS[preset][kind], ...overrides }
}

export function clampPdfFillScale(scale: number): number {
  return Math.min(0.95, Math.max(0.55, scale / 100))
}

export function computePdfRowHeight(rowCount: number): number {
  const safeRowCount = Math.max(rowCount, 1)
  const totalRowGap = Math.max(0, safeRowCount - 1) * PDF_ROW_GAP
  return (PDF_USABLE_PAGE_HEIGHT - totalRowGap) / safeRowCount
}

export function computePdfBarcodeMetrics(rowHeight: number, fillScale: number, dual: boolean) {
  return {
    gap: dual ? 4 * fillScale : 0,
    longHeight: (dual ? rowHeight * 0.46 : rowHeight * 0.82) * fillScale,
    shortHeight: rowHeight * 0.34 * fillScale,
    shortWidth: dual ? '76%' : '100%',
  }
}
