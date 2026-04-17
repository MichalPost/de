import { downloadBlob, escapeXmlText, escapeXmlAttr } from './utils'

// Map<code, pattern> for O(1) lookup instead of array index access
const CODE128_PATTERNS = new Map<number, string>([
  [0,'212222'],[1,'222122'],[2,'222221'],[3,'121223'],[4,'121322'],[5,'131222'],[6,'122213'],[7,'122312'],[8,'132212'],[9,'221213'],
  [10,'221312'],[11,'231212'],[12,'112232'],[13,'122132'],[14,'122231'],[15,'113222'],[16,'123122'],[17,'123221'],[18,'223211'],[19,'221132'],
  [20,'221231'],[21,'213212'],[22,'223112'],[23,'312131'],[24,'311222'],[25,'321122'],[26,'321221'],[27,'312212'],[28,'322112'],[29,'322211'],
  [30,'212123'],[31,'212321'],[32,'232121'],[33,'111323'],[34,'131123'],[35,'131321'],[36,'112313'],[37,'132113'],[38,'132311'],[39,'211313'],
  [40,'231113'],[41,'231311'],[42,'112133'],[43,'112331'],[44,'132131'],[45,'113123'],[46,'113321'],[47,'133121'],[48,'313121'],[49,'211331'],
  [50,'231131'],[51,'213113'],[52,'213311'],[53,'213131'],[54,'311123'],[55,'311321'],[56,'331121'],[57,'312113'],[58,'312311'],[59,'332111'],
  [60,'314111'],[61,'221411'],[62,'431111'],[63,'111224'],[64,'111422'],[65,'121124'],[66,'121421'],[67,'141122'],[68,'141221'],[69,'112214'],
  [70,'112412'],[71,'122114'],[72,'122411'],[73,'142112'],[74,'142211'],[75,'241211'],[76,'221114'],[77,'413111'],[78,'241112'],[79,'134111'],
  [80,'111242'],[81,'121142'],[82,'121241'],[83,'114212'],[84,'124112'],[85,'124211'],[86,'411212'],[87,'421112'],[88,'421211'],[89,'212141'],
  [90,'214121'],[91,'412121'],[92,'111143'],[93,'111341'],[94,'131141'],[95,'114113'],[96,'114311'],[97,'411113'],[98,'411311'],[99,'113141'],
  [100,'114131'],[101,'311141'],[102,'411131'],[103,'211412'],[104,'211214'],[105,'211232'],[106,'2331112'],
])

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

  const patterns = encodeCode128B(text).map((code) => {
    const pattern = CODE128_PATTERNS.get(code)
    if (!pattern) throw new Error(`Unknown Code128 code: ${code}`)
    return pattern
  })
  const totalModules = patterns.reduce(
    (sum, pattern) => {
      let inner = 0
      for (const ch of pattern) inner += Number(ch)
      return sum + inner
    },
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

  const pngBlob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to create PNG blob.')), 'image/png')
  )

  URL.revokeObjectURL(url)
  downloadBlob(pngBlob, filename)
}
