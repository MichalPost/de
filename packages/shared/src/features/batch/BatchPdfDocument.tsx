import { Document, Page, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { BatchGeneratedRecord } from './types'
import { barcodeToPngDataUrl } from '../../lib/barcode'
import {
  PDF_COL_GAP,
  PDF_PAGE_PADDING,
  PDF_ROW_GAP,
  chunkItems,
  clampPdfFillScale,
  computePdfBarcodeMetrics,
  computePdfRowHeight,
  getBatchBarcodeOptions,
  resolvePrintMode,
  type BatchPrintMode,
} from './layout'

const styles = StyleSheet.create({
  page: { padding: PDF_PAGE_PADDING, backgroundColor: '#ffffff' },
  grid: { flexDirection: 'column', width: '100%' },
  row: { flexDirection: 'row', width: '100%' },
  cell: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  stack: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  barcode: { objectFit: 'contain' },
  emptyCell: { flex: 1 },
})

interface Props {
  records: BatchGeneratedRecord[]
  globalMode?: BatchPrintMode
  cols: number
  perPage: number
  scale?: number
}

export function BatchPdfDocument({ records, globalMode, cols, perPage, scale = 72 }: Props) {
  const pages = chunkItems(records, perPage)
  const fillScale = clampPdfFillScale(scale)

  const barcodeCache = new Map<string, string>()
  const getLongUrl = (text: string) => {
    const key = `long|${text}`
    const cached = barcodeCache.get(key)
    if (cached) return cached
    const val = barcodeToPngDataUrl(text, getBatchBarcodeOptions('pdf', 'long'))
    barcodeCache.set(key, val)
    return val
  }
  const getShortUrl = (text: string) => {
    const key = `short|${text}`
    const cached = barcodeCache.get(key)
    if (cached) return cached
    const val = barcodeToPngDataUrl(text, getBatchBarcodeOptions('pdf', 'short'))
    barcodeCache.set(key, val)
    return val
  }

  return (
    <Document title="批量条码导出" author="Reagent Workbench">
      {pages.map((pageRecords, pi) => (
        (() => {
          const rows = chunkItems(pageRecords, cols)
          const rowHeight = computePdfRowHeight(rows.length)

          return (
            <Page key={pi} size="A4" style={styles.page}>
              <View style={styles.grid}>
                {rows.map((row, ri) => (
                  <View
                    key={ri}
                    wrap={false}
                    style={[
                      styles.row,
                      {
                        height: rowHeight,
                        marginBottom: ri === rows.length - 1 ? 0 : PDF_ROW_GAP,
                        columnGap: PDF_COL_GAP,
                      },
                    ]}
                  >
                    {row.map((r, ci) => {
                      const mode = resolvePrintMode(r, globalMode)
                      const longUrl = (mode === 'long' || mode === 'both') ? getLongUrl(r.encodedAscii) : null
                      const shortUrl = (mode === 'short' || mode === 'both') ? getShortUrl(r.shortAscii) : null
                      const isDual = Boolean(longUrl && shortUrl)
                      const metrics = computePdfBarcodeMetrics(rowHeight, fillScale, isDual)

                      return (
                        <View
                          key={ci}
                          style={[
                            styles.cell,
                            {
                              flex: 1,
                              height: '100%',
                              paddingHorizontal: 4,
                            },
                          ]}
                        >
                          <View style={[styles.stack, { gap: metrics.gap }]}>
                            {longUrl && (
                              <Image
                                src={longUrl}
                                style={[
                                  styles.barcode,
                                  {
                                    width: '100%',
                                    height: metrics.longHeight,
                                  },
                                ]}
                              />
                            )}
                            {shortUrl && (
                              <Image
                                src={shortUrl}
                                style={[
                                  styles.barcode,
                                  {
                                    width: metrics.shortWidth,
                                    height: isDual ? metrics.shortHeight : metrics.longHeight,
                                  },
                                ]}
                              />
                            )}
                          </View>
                        </View>
                      )
                    })}
                    {Array.from({ length: Math.max(0, cols - row.length) }).map((_, emptyIndex) => (
                      <View key={`empty-${emptyIndex}`} style={styles.emptyCell} />
                    ))}
                  </View>
                ))}
              </View>
            </Page>
          )
        })()
      ))}
    </Document>
  )
}
