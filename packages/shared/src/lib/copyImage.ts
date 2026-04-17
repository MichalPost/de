import { renderBarcodeToCanvas } from './barcode'

/**
 * Copy a barcode PNG to clipboard at maximum quality.
 * Uses ahooks useClipboard pattern internally via direct Clipboard API.
 */
export async function copyBarcodeAsPng(ascii: string, isShort = false): Promise<void> {
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
