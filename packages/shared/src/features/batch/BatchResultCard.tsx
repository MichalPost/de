import { memo, useMemo } from 'react'
import { twMerge } from 'tailwind-merge'
import type { BatchGeneratedRecord } from './types'
import { Button } from '../../ui/Button'
import { CopyButton, useCopyAsync } from '../../ui/CopyButton'
import { usePlatformOps } from '../../lib/platformOps'
import { barcodeToPngDataUrl } from '../../lib/barcode'
import { motion } from 'motion/react'
import { ImgIcon, CheckIcon } from '../../ui/icons'
import { getBatchBarcodeOptions } from './layout'

export const BatchResultCard = memo(function BatchResultCard({ record, index = 0 }: { record: BatchGeneratedRecord; index?: number }) {
  const longUrl = useMemo(
    () => barcodeToPngDataUrl(record.encodedAscii, getBatchBarcodeOptions('resultCard', 'long')),
    [record.encodedAscii],
  )
  const shortUrl = useMemo(
    () => barcodeToPngDataUrl(record.shortAscii, getBatchBarcodeOptions('resultCard', 'short')),
    [record.shortAscii],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3), ease: 'easeOut' }}
      className="flex flex-col gap-3 rounded-xl border border-ct-border bg-ct-surface-card p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-ct-brand-soft px-2 py-0.5 text-[11px] font-semibold text-ct-brand-foreground">
            编号 {record.reagentId}
          </span>
          <span className="text-[11px] text-ct-content-muted">
            序号 {record.serialNumber} · 代理商 {String(record.agentId).padStart(4, '0')} · 客户 {String(record.customerId).padStart(5, '0')}
          </span>
        </div>
        <span className="text-[11px] text-ct-content-faint">#{record.index}</span>
      </div>

      <div className="flex flex-col gap-3">
        <BarcodeBlock
          label="长码"
          ascii={record.encodedAscii}
          previewUrl={longUrl}
          filenameBase={`long_${record.reagentId}_${record.index}`}
        />
        <BarcodeBlock
          label="短码"
          ascii={record.shortAscii}
          previewUrl={shortUrl}
          filenameBase={`short_${record.reagentId}_${record.index}`}
          compact
        />
      </div>
    </motion.div>
  )
})

const BarcodeBlock = memo(function BarcodeBlock({
  label, ascii, previewUrl, filenameBase, compact,
}: {
  label: string
  ascii: string
  previewUrl: string
  filenameBase: string
  compact?: boolean
}) {
  const { copying, copied, copy } = useCopyAsync()
  const platform = usePlatformOps()

  const handleCopyImg = () =>
    copy(() => platform.copyBarcodeAsPng(ascii, compact)).catch(() =>
      platform.downloadBarcodePng(ascii, `${filenameBase}.png`)
    )

  return (
    <div className={`flex flex-col gap-2 ${compact ? '' : 'flex-1 min-w-0'}`}>
      <div className="flex items-center justify-between min-w-0">
        <span className="text-[11px] font-medium text-ct-content-secondary">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <CopyButton value={ascii} />
          <button
            type="button"
            onClick={handleCopyImg}
            disabled={copying}
            title="复制条码图片"
            className={twMerge(
              'inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              copied
                ? 'border-ct-success-border bg-ct-success-soft text-ct-success-foreground'
                : 'border-ct-border bg-ct-surface-input text-ct-content-muted hover:border-ct-brand hover:bg-ct-brand-soft hover:text-ct-brand-foreground',
            )}
          >
            {copied ? <CheckIcon /> : <ImgIcon />}
            <span className="hidden sm:inline">{copied ? '已复制' : copying ? '复制中…' : '复制图片'}</span>
          </button>
          <Button
            onClick={() => platform.downloadBarcodePng(ascii, `${filenameBase}.png`)}
            variant="ghost"
            size="sm"
            className="min-h-0 px-2 py-0.5 text-[11px]"
            title="下载 PNG"
          >PNG</Button>
        </div>
      </div>
      <div
        className={twMerge(
          'flex flex-col items-center rounded-lg border border-ct-border bg-ct-surface-input p-2',
          compact ? 'min-h-[72px]' : 'min-h-[80px]',
        )}
      >
        <img src={previewUrl} alt={ascii} className="max-w-full" />
      </div>
    </div>
  )
})
