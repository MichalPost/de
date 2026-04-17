import { Document, Page, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { BatchGeneratedRecord } from './types'
import { barcodeToPngDataUrl } from '../../lib/barcode'

const PAGE_PADDING = 18
const ROW_GAP = 10
const COL_GAP = 16
const A4_HEIGHT = 842
const PAGE_SAFE_BOTTOM = 12
const USABLE_PAGE_HEIGHT = A4_HEIGHT - PAGE_PADDING * 2 - PAGE_SAFE_BOTTOM

const styles = StyleSheet.create({
  page: { padding: PAGE_PADDING, backgroundColor: '#ffffff' },
  grid: { flexDirection: 'column', width: '100%' },
  row: { flexDirection: 'row', width: '100%' },
  cell: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  stack: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  barcode: { objectFit: 'contain' },
})

interface Props {
  records: BatchGeneratedRecord[]
  globalMode?: 'long' | 'short' | 'both'
  cols: number
  perPage: number
  scale?: number
}

export function BatchPdfDocument({ records, globalMode, cols, perPage, scale = 72 }: Props) {
  const pages: BatchGeneratedRecord[][] = []
  for (let i = 0; i < records.length; i += perPage) pages.push(records.slice(i, i + perPage))
  const fillScale = Math.min(0.95, Math.max(0.55, scale / 100))

  const barcodeCache = new Map<string, string>()
  const getLongUrl = (text: string) => {
    const key = `long|${text}`
    const cached = barcodeCache.get(key)
    if (cached) return cached
    const val = barcodeToPngDataUrl(text, { width: 2.4, height: 112, margin: 2 })
    barcodeCache.set(key, val)
    return val
  }
  const getShortUrl = (text: string) => {
    const key = `short|${text}`
    const cached = barcodeCache.get(key)
    if (cached) return cached
    const val = barcodeToPngDataUrl(text, { width: 3.2, height: 112, margin: 2 })
    barcodeCache.set(key, val)
    return val
  }

  return (
    <Document title="批量条码导出" author="Reagent Workbench">
      {pages.map((pageRecords, pi) => (
        (() => {
          const rows: BatchGeneratedRecord[][] = []
          for (let i = 0; i < pageRecords.length; i += cols) {
            rows.push(pageRecords.slice(i, i + cols))
          }

          const rowCount = Math.max(rows.length, 1)
          const totalRowGap = Math.max(0, rowCount - 1) * ROW_GAP
          const rowHeight = (USABLE_PAGE_HEIGHT - totalRowGap) / rowCount

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
                        marginBottom: ri === rows.length - 1 ? 0 : ROW_GAP,
                        columnGap: COL_GAP,
                      },
                    ]}
                  >
                    {row.map((r, ci) => {
                      const mode = globalMode ?? r.printMode
                      const longUrl = (mode === 'long' || mode === 'both') ? getLongUrl(r.encodedAscii) : null
                      const shortUrl = (mode === 'short' || mode === 'both') ? getShortUrl(r.shortAscii) : null
                      const isDual = Boolean(longUrl && shortUrl)
                      const longHeight = (isDual ? rowHeight * 0.46 : rowHeight * 0.82) * fillScale
                      const shortHeight = rowHeight * 0.34 * fillScale

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
                          <View style={[styles.stack, { gap: isDual ? 4 * fillScale : 0 }]}>
                            {longUrl && (
                              <Image
                                src={longUrl}
                                style={[
                                  styles.barcode,
                                  {
                                    width: '100%',
                                    height: longHeight,
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
                                    width: isDual ? '76%' : '100%',
                                    height: isDual ? shortHeight : longHeight,
                                  },
                                ]}
                              />
                            )}
                          </View>
                        </View>
                      )
                    })}
                    {Array.from({ length: Math.max(0, cols - row.length) }).map((_, emptyIndex) => (
                      <View key={`empty-${emptyIndex}`} style={{ flex: 1 }} />
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
