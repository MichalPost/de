import { renderBarcodeToCanvas } from '@chemtools/shared/lib/barcode'

/** Convert blob to base64 string (without data: prefix) */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
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
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
  )

  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')

  const base64 = await blobToBase64(blob)
  const filename = `barcode-${Date.now()}.png`
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })

  await Share.share({
    title: '条码图片',
    url: result.uri,
    dialogTitle: '保存或分享条码',
  })
}

/**
 * Download barcode PNG using Capacitor Filesystem + Share
 */
export async function downloadBarcodePng(text: string, filename: string): Promise<void> {
  const canvas = renderBarcodeToCanvas(text, {
    width: 3,
    height: 120,
    fontSize: 18,
    margin: 14,
  })
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
  )

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
    dialogTitle: '保存或分享',
  })
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
  const json = JSON.stringify(data, null, 2)
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')

  const result = await Filesystem.writeFile({
    path: filename,
    data: btoa(json), // base64 encode
    directory: Directory.Cache,
  })

  await Share.share({
    title: filename,
    url: result.uri,
    dialogTitle: '保存或分享',
  })
}

/**
 * Copy text to clipboard using Capacitor Clipboard plugin
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  const { Clipboard } = await import('@capacitor/clipboard')
  await Clipboard.write({ string: text })
}
