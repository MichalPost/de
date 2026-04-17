import { Document, Page, View, Image, Text, StyleSheet } from '@react-pdf/renderer'
import type { BatchGeneratedRecord } from './types'
import { barcodeToPngDataUrl } from '../../lib/barcode'

const styles = StyleSheet.create({
  page: { padding: 24, backgroundColor: '#ffffff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexDirection: 'column', alignItems: 'center', padding: 6 },
  barcode: { objectFit: 'contain' },
  label: { fontSize: 7, fontFamily: 'Courier', color: '#46362b', marginTop: 2, textAlign: 'center' },
  meta: { fontSize: 6, color: '#9CA3AF', textAlign: 'center', marginTop: 1 },
})

interface Props {
  records: BatchGeneratedRecord[]
  globalMode?: 'long' | 'short' | 'both'
  cols: number
  perPage: number
}

export function BatchPdfDocument({ records, globalMode, cols, perPage }: Props) {
  const pages: BatchGeneratedRecord[][] = []
  for (let i = 0; i < records.length; i += perPage) pages.push(records.slice(i, i + perPage))

  const cellWidthPct = `${Math.floor(100 / cols)}%` as `${number}%`

  const barcodeCache = new Map<string, string>()
  const getLongUrl = (text: string) => {
    const key = `long|${text}`
    const cached = barcodeCache.get(key)
    if (cached) return cached
    const val = barcodeToPngDataUrl(text, { width: 2, height: 80, margin: 10 })
    barcodeCache.set(key, val)
    return val
  }
  const getShortUrl = (text: string) => {
    const key = `short|${text}`
    const cached = barcodeCache.get(key)
    if (cached) return cached
    const val = barcodeToPngDataUrl(text, { width: 2.5, height: 80, margin: 10 })
    barcodeCache.set(key, val)
    return val
  }

  return (
    <Document title="批量条码导出" author="Reagent Workbench">
      {pages.map((pageRecords, pi) => (
        <Page key={pi} size="A4" style={styles.page}>
          <View style={styles.grid}>
            {pageRecords.map((r, ri) => {
              const mode = globalMode ?? r.printMode
              const longUrl = (mode === 'long' || mode === 'both') ? getLongUrl(r.encodedAscii) : null
              const shortUrl = (mode === 'short' || mode === 'both') ? getShortUrl(r.shortAscii) : null

              return (
                <View key={ri} style={[styles.cell, { width: cellWidthPct }]}>
                  {longUrl && <Image src={longUrl} style={[styles.barcode, { width: '100%', height: 48 }]} />}
                  {shortUrl && <Image src={shortUrl} style={[styles.barcode, { width: '60%', height: 48 }]} />}
                  <Text style={styles.meta}>编号 {r.reagentId} · 序号 {r.serialNumber}</Text>
                </View>
              )
            })}
          </View>
        </Page>
      ))}
    </Document>
  )
}
