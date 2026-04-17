import { downloadBlob } from './utils'

const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]

function escapeXmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeXmlAttr(value: string): string {
  return escapeXmlText(value)
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function encodeCode128B(text: string): number[] {
  if (!text || !text.length) {
    throw new Error('Barcode text is empty.')
  }

  const codes = [104]
  for (const character of text) {
    const value = character.charCodeAt(0)
    if (value < 32 || value > 126) {
      throw new Error('Code 128-B only supports ASCII characters between 32 and 126.')
    }
    codes.push(value - 32)
  }

  const checksum = codes.reduce((total, code, index) => total + (index === 0 ? code : code * index), 0) % 103
  codes.push(checksum, 106)
  return codes
}

export function createBarcodeSvg(text: string, options: { moduleWidth?: number; height?: number; quietZone?: number; fontSize?: number; caption?: string | false; sharp?: boolean } = {}): string {
  const moduleWidth = options.moduleWidth ?? 2
  const height = options.height ?? 104
  const quietZone = options.quietZone ?? 18
  const fontSize = options.fontSize ?? 14
  const showCaption = options.caption !== false && options.caption !== ''
  const caption = showCaption ? (options.caption ?? text) : ''
  const escapedLabel = escapeXmlAttr(text)
  const escapedCaption = showCaption ? escapeXmlText(caption as string) : ''
  // sharp=true: no rx rounding on bars — better for high-res raster export
  const rx = options.sharp ? '0' : '1'

  const patterns = encodeCode128B(text).map((code) => CODE128_PATTERNS[code])
  const totalModules = patterns.reduce(
    (sum, pattern) => sum + Array.from(pattern).reduce((inner, width) => inner + Number(width), 0),
    0,
  )
  const barcodeWidth = (quietZone * 2 + totalModules) * moduleWidth

  // Estimate caption text width conservatively (monospace + letter-spacing)
  // Use a generous multiplier to avoid clipping
  const charWidth = fontSize * 0.9 + 2
  const captionWidth = showCaption
    ? (caption as string).length * charWidth + quietZone * 4
    : 0
  const width = Math.max(barcodeWidth, captionWidth)

  // Center barcode within the (possibly wider) SVG
  const barcodeOffset = (width - barcodeWidth) / 2
  let cursor = quietZone * moduleWidth + barcodeOffset
  const bars: string[] = []

  for (const pattern of patterns) {
    let drawBar = true
    for (const character of pattern) {
      const barWidth = Number(character) * moduleWidth
      if (drawBar) {
        bars.push(`<rect x="${cursor}" y="10" width="${barWidth}" height="${height}" rx="${rx}" />`)
      }
      cursor += barWidth
      drawBar = !drawBar
    }
  }

  const totalHeight = showCaption ? height + 36 : height + 16
  const textEl = showCaption
    ? `<text x="50%" y="${height + 28}" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-size="${fontSize}" fill="#46362b" letter-spacing="1.1">${escapedCaption}</text>`
    : ''

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalHeight}" width="${width}" height="${totalHeight}" role="img" aria-label="${escapedLabel}">
      <rect width="100%" height="100%" fill="#ffffff" />
      <g fill="#181514">${bars.join('')}</g>
      ${textEl}
    </svg>
  `.trim()
}

export function downloadBarcodeSvg(text: string, filename: string): void {
  const svg = createBarcodeSvg(text)
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filename)
}

export async function downloadBarcodePng(text: string, filename: string): Promise<void> {
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    throw new Error('PNG export is only available in a browser environment.')
  }

  const svg = createBarcodeSvg(text)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const image = new Image()
  image.decoding = 'async'

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to render SVG for PNG export.'))
    image.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.width * 2
  canvas.height = image.height * 2
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  context.scale(2, 2)
  context.drawImage(image, 0, 0)

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((generatedBlob) => {
      if (!generatedBlob) {
        reject(new Error('Failed to create PNG blob.'))
        return
      }
      resolve(generatedBlob)
    }, 'image/png')
  })

  URL.revokeObjectURL(url)
  downloadBlob(pngBlob, filename)
}

export function openBarcodePrintView(text: string, title: string): void {
  if (typeof window === 'undefined') {
    throw new Error('Print preview is only available in a browser environment.')
  }

  const svg = createBarcodeSvg(text, { height: 112, moduleWidth: 2.3, fontSize: 16, caption: text })
  const printWindow = window.open('', '_blank', 'width=900,height=640')
  if (!printWindow) {
    throw new Error('Unable to open print window.')
  }

  printWindow.document.title = title
  printWindow.document.head.innerHTML = `
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f3efe6;
        font-family: 'Manrope', 'Segoe UI', sans-serif;
      }
      article {
        padding: 32px;
        border: 1px solid #d5c6ae;
        background: white;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 18px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-family: 'IBM Plex Mono', monospace;
      }
    </style>
  `
  printWindow.document.body.innerHTML = `
    <article>
      <h1>${title}</h1>
      ${svg}
    </article>
  `
  printWindow.onload = () => printWindow.print()
}
