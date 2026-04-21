import { forwardRef, memo, useMemo, type CSSProperties } from 'react'
import type { BatchGeneratedRecord } from './types'
import { barcodeToPngDataUrl } from '../../lib/barcode'
import { chunkItems, getBatchBarcodeOptions, resolvePrintMode, type BatchPrintMode } from './layout'

interface Props {
  records: BatchGeneratedRecord[]
  globalMode?: BatchPrintMode
  cols?: number
  perPage?: number
}

export const PrintLayout = forwardRef<HTMLDivElement, Props>(
  ({ records, globalMode, cols = 1, perPage = 10 }, ref) => {
    const pages = useMemo(() => chunkItems(records, perPage), [records, perPage])

    return (
      <div ref={ref} className="w-full bg-white">
        {pages.map((pageRecords, pi) => {
          const rows = chunkItems(pageRecords, cols)
          const isLast = pi === pages.length - 1
          return (
            <div
              key={pi}
              data-print-page={pi}
              className="px-8 py-6"
              style={{
                pageBreakAfter: isLast ? 'auto' : 'always',
                breakAfter: isLast ? 'auto' : 'page',
              }}
            >
              {rows.map((row, ri) => (
                <div
                  key={ri}
                  className="mb-5 grid gap-y-4 gap-x-6 [grid-template-columns:repeat(var(--print-cols),minmax(0,1fr))]"
                  style={{
                    '--print-cols': cols,
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  } as CSSProperties}
                >
                  {row.map((record, ci) => (
                    <PrintCell
                      key={ci}
                      record={record}
                      mode={resolvePrintMode(record, globalMode)}
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
    return barcodeToPngDataUrl(record.encodedAscii, getBatchBarcodeOptions('print', 'long'))
  }, [mode, record.encodedAscii])

  const shortUrl = useMemo(() => {
    if (mode !== 'short' && mode !== 'both') return null
    return barcodeToPngDataUrl(record.shortAscii, getBatchBarcodeOptions('print', 'short'))
  }, [mode, record.shortAscii])

  return (
    <div className="flex flex-col items-center gap-2">
      {longUrl && <BarcodeItem imgUrl={longUrl} ascii={record.encodedAscii} />}
      {shortUrl && <BarcodeItem imgUrl={shortUrl} ascii={record.shortAscii} />}
    </div>
  )
})

const BarcodeItem = memo(function BarcodeItem({ imgUrl, ascii }: { imgUrl: string; ascii: string }) {
  return (
    <div className="flex w-full flex-col items-center">
      <img src={imgUrl} alt={ascii} className="max-w-full" />
    </div>
  )
})
