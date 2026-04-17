import JsBarcode from 'jsbarcode'
import { downloadBlob } from './utils'

export interface BarcodeOptions {
  /** px per module (bar width unit). Higher = sharper/larger. Default 2 */
  width?: number
  /** bar height in px. Default 80 */
  height?: number
  /** show ASCII text below barcode. Default true */
  displayValue?: boolean
  /** font size for caption. Default 14 */
  fontSize?: number
  /** margin around barcode in px. Default 10 */
  margin?: number
}

/**
 * Render a Code128 barcode directly to an HTMLCanvasElement.
 * Returns the canvas — no SVG involved, no conversion needed.
 */
export function renderBarcodeToCanvas(
  text: string,
  options: BarcodeOptions = {},
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, text, {
    format: 'CODE128',
    width: options.width ?? 2,
    height: options.height ?? 80,
    displayValue: options.displayValue ?? true,
    fontSize: options.fontSize ?? 14,
    fontOptions: '',
    font: '"IBM Plex Mono", monospace',
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 4,
    margin: options.margin ?? 10,
    background: '#ffffff',
    lineColor: '#181514',
  })
  return canvas
}

/**
 * Get a data URL (PNG) from a barcode canvas.
 */
export function barcodeToPngDataUrl(text: string, options: BarcodeOptions = {}): string {
  return renderBarcodeToCanvas(text, options).toDataURL('image/png')
}

/**
 * Get a Blob (PNG) from a barcode canvas.
 */
export function barcodeToPngBlob(text: string, options: BarcodeOptions = {}): Promise<Blob> {
  return new Promise((resolve, reject) => {
    renderBarcodeToCanvas(text, options).toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      'image/png',
    )
  })
}

/**
 * Copy barcode as PNG to clipboard.
 */
export async function copyBarcodeToClipboard(text: string, options: BarcodeOptions = {}): Promise<void> {
  const blob = await barcodeToPngBlob(text, options)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

/**
 * Download barcode as PNG file.
 */
export async function downloadBarcodePng(text: string, filename: string, options: BarcodeOptions = {}): Promise<void> {
  const blob = await barcodeToPngBlob(text, options)
  downloadBlob(blob, filename)
}

/**
 * Download barcode as SVG file (via JsBarcode SVG renderer).
 */
export function downloadBarcodeSvg(text: string, filename: string): void {
  // JsBarcode can render to a detached SVG element
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svgEl, text, {
    format: 'CODE128',
    width: 2,
    height: 80,
    displayValue: true,
    fontSize: 14,
    font: '"IBM Plex Mono", monospace',
    margin: 10,
    background: '#ffffff',
    lineColor: '#181514',
    xmlDocument: document,
  })
  const svgStr = new XMLSerializer().serializeToString(svgEl)
  downloadBlob(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }), filename)
}

/**
 * Open a print preview window with the barcode.
 */
export function openBarcodePrintView(text: string, title: string): void {
  const canvas = renderBarcodeToCanvas(text, { width: 3, height: 112, fontSize: 16, margin: 16 })
  const dataUrl = canvas.toDataURL('image/png')
  const win = window.open('', '_blank', 'width=900,height=640')
  if (!win) return
  win.document.write(`
    <html><head><title>${title}</title>
    <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f3efe6}
    article{padding:32px;border:1px solid #d5c6ae;background:white}
    h1{margin:0 0 16px;font-size:18px;letter-spacing:.14em;text-transform:uppercase;font-family:'IBM Plex Mono',monospace}
    </style></head>
    <body><article><h1>${title}</h1><img src="${dataUrl}" /></article>
    <script>window.onload=()=>window.print()</script></body></html>
  `)
  win.document.close()
}
