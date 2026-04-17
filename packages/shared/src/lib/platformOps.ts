/**
 * Platform-specific file/clipboard/print operations.
 * Each app provides its own implementation via PlatformOpsContext.Provider.
 */
export interface PlatformOps {
  // Barcode image ops
  copyBarcodeAsPng(ascii: string, isShort?: boolean): Promise<void>
  downloadBarcodePng(ascii: string, filename: string, isShort?: boolean): Promise<void>
  openBarcodePrintView(ascii: string, title?: string): Promise<void>
  // File export
  exportJsonFile(data: unknown, filename: string): Promise<void>
  /**
   * Read a File into a Blob.
   * On Android, File permissions expire after the first await, so we must
   * read all bytes immediately. On web, we can just return the File as-is.
   */
  readFileAsBlob(file: File): Promise<Blob>
  // Batch export — platform-specific (web: <a> download, mobile: Capacitor share)
  exportBatchAsPng(
    records: import('../features/batch/types').BatchGeneratedRecord[],
    globalMode: 'long' | 'short' | 'both' | undefined,
    cols: number,
    perPage: number,
    filename: string,
  ): Promise<void>
  copyBatchAsImage(
    records: import('../features/batch/types').BatchGeneratedRecord[],
    globalMode: 'long' | 'short' | 'both' | undefined,
    cols: number,
    perPage: number,
  ): Promise<void>
  exportBatchAsPdf(
    records: import('../features/batch/types').BatchGeneratedRecord[],
    globalMode: 'long' | 'short' | 'both' | undefined,
    cols: number,
    perPage: number,
    templateName: string,
    scale?: number,
  ): Promise<void>
  /** Export a single barcode (long + short) as a PDF, same style as batch export */
  exportSingleBarcodePdf(
    encodedAscii: string,
    shortAscii: string,
    filename: string,
    mode?: 'long' | 'short' | 'both',
    scale?: number,
  ): Promise<void>
  readonly maxPagesPerPng: number
}
import { createContext, useContext } from 'react'

export const PlatformOpsContext = createContext<PlatformOps | null>(null)

export function usePlatformOps(): PlatformOps {
  const ctx = useContext(PlatformOpsContext)
  if (!ctx) throw new Error('usePlatformOps must be used inside PlatformOpsContext.Provider')
  return ctx
}
