import { renderBarcodeToCanvas } from '@chemtools/shared/lib/barcode'
import { canvasToBlob, blobToBase64 } from '@chemtools/shared/lib/utils'

/** Write a base64 string to Capacitor cache and share it. */
async function writeAndShare(filename: string, base64: string, title: string): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache })
  await Share.share({ title, url: result.uri, dialogTitle: '保存或分享' })
}

/**
 * Copy barcode as PNG using Capacitor Share (Android doesn't support clipboard.write for images)
 */
export async function copyBarcodeAsPng(ascii: string, isShort = false): Promise<void> {
  const canvas = renderBarcodeToCanvas(ascii, {
    width: isShort ? 4 : 3,
    height: 120,
    fontSize: 18,
    margin: 14,
  })
  const base64 = await blobToBase64(await canvasToBlob(canvas))
  const filename = `barcode-${Date.now()}.png`
  await writeAndShare(filename, base64, '条码图片')
}

/**
 * Download barcode PNG using Capacitor Filesystem + Share
 */
export async function downloadBarcodePng(text: string, filename: string): Promise<void> {
  const canvas = renderBarcodeToCanvas(text, { width: 3, height: 120, fontSize: 18, margin: 14 })
  const base64 = await blobToBase64(await canvasToBlob(canvas))
  await writeAndShare(filename, base64, filename)
}

/**
 * Print barcode - Android doesn't support window.open, use share instead
 */
export async function openBarcodePrintView(text: string, title: string): Promise<void> {
  // On mobile, "print" means share/save the image
  await downloadBarcodePng(text, `${title}.png`)
}

/**
 * Export JSON file using Capacitor Filesystem + Share
 */
export async function exportJsonFile(data: unknown, filename: string): Promise<void> {
  await writeAndShare(filename, btoa(JSON.stringify(data, null, 2)), filename)
}

/**
 * Copy text to clipboard using Capacitor Clipboard plugin
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  const { Clipboard } = await import('@capacitor/clipboard')
  await Clipboard.write({ string: text })
}
