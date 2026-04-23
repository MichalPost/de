import { readBarcodesFromImageFile, type ReaderOptions } from 'zxing-wasm/reader'
import { asciiToBytes, bytesToHex } from './utils'

// ─── PDF support ────────────────────────────────────────────────────────────

async function pdfToImageBlobs(file: File | Blob): Promise<Blob[]> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  // Use the bundled legacy worker (no separate worker file needed)
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  const blobs: Blob[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => (b ? res(b) : rej(new Error('canvas toBlob failed'))), 'image/png'),
    )
    blobs.push(blob)
  }
  return blobs
}

/**
 * Scan a File/Blob for barcodes. If the file is a PDF, each page is rendered
 * to a canvas first, then scanned. Returns all found results across all pages.
 */
export async function scanBarcodeFileOrPdf(file: File | Blob): Promise<ScanResult[]> {
  const isPdf =
    (file instanceof File && (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf')) ||
    file.type === 'application/pdf'

  if (!isPdf) return scanBarcodeFile(file)

  const pages = await pdfToImageBlobs(file)
  const all: ScanResult[] = []
  for (const page of pages) {
    const results = await scanBarcodeFile(page)
    all.push(...results)
  }
  return all
}

const READER_OPTIONS: ReaderOptions = {
  formats: ['Code128', 'QRCode'],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  maxNumberOfSymbols: 10,
}

export interface ScanResult {
  text: string
  format: string
}

/**
 * Scan a File/Blob for Code128 barcodes using ZXing-C++ WASM.
 */
export async function scanBarcodeFile(file: File | Blob): Promise<ScanResult[]> {
  const results = await readBarcodesFromImageFile(file, READER_OPTIONS)
  return results
    .filter(r => r.isValid)
    .map(r => ({ text: r.text, format: r.format }))
}

/**
 * Long code: starts with '*' + 22 base69 ASCII chars (total 23 chars with prefix).
 * Short code: starts with '#' + 4 base69 ASCII chars (total 5 chars with prefix).
 *
 * base69 chars are in ASCII range 58–126 (excluding some).
 * The '*' prefix (0x2A=42) and '#' prefix (0x23=35) are the markers.
 */
export function classifyBarcode(text: string): 'long' | 'short' | 'unknown' {
  const t = text.trim()
  // Long: '*' + 22 chars = 23 total, or without prefix = 22 chars
  if ((t.startsWith('*') && t.length === 23) || t.length === 22) return 'long'
  // Short: '#' + 4 chars = 5 total, or without prefix = 4 chars
  if ((t.startsWith('#') && t.length === 5) || t.length === 4) return 'short'
  // Also accept hex long code (44 hex chars = 22 bytes) — from manual input
  if (/^[0-9A-Fa-f]{44}$/.test(t)) return 'long'
  return 'unknown'
}

/**
 * Strip the leading '*' or '#' prefix from a scanned barcode.
 */
export function cleanBarcodeText(text: string): string {
  return text.trim().replace(/^[*#]/, '')
}

/**
 * Convert base69 ASCII long code to the 22-byte hex string that decodeLongCode() expects.
 * Input: raw ASCII string WITHOUT the leading '*' (22 chars).
 * Output: 44-char hex string.
 */
export function longAsciiToDecodeHex(ascii: string): string {
  const clean = ascii.replace(/^\*/, '').trim()
  if (clean.length !== 22) throw new Error(`长码应为 22 字符，实际 ${clean.length} 字符`)
  return bytesToHex(asciiToBytes(clean))
}

/**
 * Given raw scanned text, return the hex string suitable for decodeLongCode(),
 * or null if it's not a long code.
 */
export function toDecodeHex(text: string): string | null {
  const t = text.trim()
  const kind = classifyBarcode(t)
  if (kind !== 'long') return null
  // Already hex
  if (/^[0-9A-Fa-f]{44}$/.test(t)) return t
  // base69 ASCII (with or without '*')
  return longAsciiToDecodeHex(t)
}

/**
 * Extract the last contiguous digit sequence from scanned text.
 * Useful for QR payloads that end with a serial or encrypted number.
 */
export function extractTrailingDigits(text: string): string | null {
  const match = text.match(/(\d+)(?![\s\S]*\d)/)
  return match?.[1] ?? null
}
