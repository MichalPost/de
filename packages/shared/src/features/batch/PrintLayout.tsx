import { forwardRef, memo, useMemo } from 'react'
import type { BatchGeneratedRecord } from './types'
import { barcodeToPngDataUrl } from '../../lib/barcode'

interface Props {
  records: BatchGeneratedRecord[]
  globalMode?: 'long' | 'short' | 'both'
  cols?: number
  perPage?: number
}

export const PrintLayout = forwardRef<HTMLDivElement, Props>(
  ({ records, globalMode, cols = 1, perPage = 10 }, ref) => {
    const pages = useMemo(() => {
      const result: BatchGeneratedRecord[][] = []
      for (let i = 0; i < records.length; i += perPage) {
        result.push(records.slice(i, i + perPage))
      }
      return result
    }, [records, perPage])

    return (
      <div ref={ref} style={{ background: '#fff', width: '100%' }}>
        {pages.map((pageRecords, pi) => {
          const rows: BatchGeneratedRecord[][] = []
          for (let i = 0; i < pageRecords.length; i += cols) {
            rows.push(pageRecords.slice(i, i + cols))
          }
          const isLast = pi === pages.length - 1
          return (
            <div
              key={pi}
              data-print-page={pi}
              style={{
                padding: '24px 32px',
                pageBreakAfter: isLast ? 'auto' : 'always',
                breakAfter: isLast ? 'auto' : 'page',
              }}
            >
              {rows.map((row, ri) => (
                <div
                  key={ri}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: '16px 24px',
                    marginBottom: 20,
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  {row.map((record, ci) => (
                    <PrintCell
                      key={ci}
                      record={record}
                      mode={globalMode ?? record.printMode}
                    />
                  ))}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  },
)
PrintLayout.displayName = 'PrintLayout'

const PrintCell = memo(function PrintCell({ record, mode }: { record: BatchGeneratedRecord; mode: 'long' | 'short' | 'both' }) {
  const longUrl = useMemo(() => {
    if (mode !== 'long' && mode !== 'both') return null
    return barcodeToPngDataUrl(record.encodedAscii, { width: 1.6, height: 72, margin: 10 })
  }, [mode, record.encodedAscii])

  const shortUrl = useMemo(() => {
    if (mode !== 'short' && mode !== 'both') return null
    return barcodeToPngDataUrl(record.shortAscii, { width: 2.2, height: 72, margin: 10 })
  }, [mode, record.shortAscii])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {longUrl && <BarcodeItem imgUrl={longUrl} ascii={record.encodedAscii} />}
      {shortUrl && <BarcodeItem imgUrl={shortUrl} ascii={record.shortAscii} />}
    </div>
  )
})

const BarcodeItem = memo(function BarcodeItem({ imgUrl, ascii }: { imgUrl: string; ascii: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <img src={imgUrl} alt={ascii} style={{ maxWidth: '100%' }} />
    </div>
  )
})
