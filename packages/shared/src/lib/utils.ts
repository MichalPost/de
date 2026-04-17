export function cleanHex(input: unknown): string {
  return String(input ?? '').replace(/[^0-9a-fA-F]/g, '').toLowerCase()
}

export function hexToBytes(input: string): Uint8Array {
  const hex = cleanHex(input)
  if (hex.length === 0) {
    return new Uint8Array()
  }

  if (hex.length % 2 !== 0) {
    throw new Error('Hex input must contain an even number of characters.')
  }

  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

export function asciiToBytes(input: string): Uint8Array {
  return Uint8Array.from(Array.from(String(input ?? ''), (character) => character.charCodeAt(0)))
}

export function bytesToAscii(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => String.fromCharCode(value)).join('')
}

export function padHex(hexValue: string, totalLength: number, reverseBytes = false): string {
  let value = cleanHex(hexValue)
  value = value.padStart(totalLength, '0')

  if (!reverseBytes) {
    return value
  }

  let reversed = ''
  for (let index = value.length - 2; index >= 0; index -= 2) {
    reversed += value.slice(index, index + 2)
  }
  return reversed
}

export function decimalToHexByte(value: number | string, lengthInBytes = 1, reverseBytes = false): string {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error('Value must be a non-negative number.')
  }
  return padHex(numeric.toString(16), lengthInBytes * 2, reverseBytes)
}

export function bcdByteToNumber(byte: number): number {
  return Math.floor(byte / 16) * 10 + (byte & 0x0f)
}

export function splitControlByte(byte: number): { checksumNibble: number; controlCode: number } {
  return {
    checksumNibble: (byte >> 4) & 0x0f,
    controlCode: byte & 0x0f,
  }
}

export function objectToEntries(object: Record<string, string | number>): string {
  return Object.entries(object)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') {
    throw new Error('Download is only available in a browser environment.')
  }

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function escapeXmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function escapeXmlAttr(value: string): string {
  return escapeXmlText(value)
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function formatFileTimestamp(date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
  )
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
