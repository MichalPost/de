import { memo, useMemo, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import type { BatchGeneratedRecord } from './types'
import { Button } from '../../ui/Button'
import { CopyButton, useCopyAsync } from '../../ui/CopyButton'
import { usePlatformOps } from '../../lib/platformOps'
import { barcodeToPngDataUrl, renderBarcodeToCanvas } from '../../lib/barcode'
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

  const [copyingCombined, setCopyingCombined] = useState(false)
  const [copiedCombined, setCopiedCombined] = useState(false)

  const handleCopyCombined = async () => {
    setCopyingCombined(true)
    try {
      await copyCombinedBarcodeImage(record.encodedAscii, record.shortAscii)
      setCopiedCombined(true)
      setTimeout(() => setCopiedCombined(false), 1500)
    } catch {
      // Fallback: download instead
      const blob = await createCombinedBarcodeBlob(record.encodedAscii, record.shortAscii)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `combined_${record.reagentId}_${record.index}.png`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setCopyingCombined(false)
    }
  }

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

      <button
        type="button"
        onClick={handleCopyCombined}
        disabled={copyingCombined}
        className={twMerge(
          'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          copiedCombined
            ? 'border-ct-success-border bg-ct-success-soft text-ct-success-foreground'
            : 'border-ct-border bg-ct-surface-input text-ct-content-primary hover:border-ct-brand hover:bg-ct-brand-soft hover:text-ct-brand-foreground',
        )}
      >
        {copiedCombined ? <CheckIcon /> : <ImgIcon />}
        {copiedCombined ? '已复制长短码图片' : copyingCombined ? '复制中…' : '复制长短码图片'}
      </button>
    </motion.div>
  )
})

async function createCombinedBarcodeBlob(longAscii: string, shortAscii: string): Promise<Blob> {
  const longCanvas = renderBarcodeToCanvas(longAscii, { width: 1.4, height: 64, displayValue: true, margin: 8 })
  const shortCanvas = renderBarcodeToCanvas(shortAscii, { width: 2, height: 64, displayValue: true, margin: 8 })

  const combinedCanvas = document.createElement('canvas')
  const padding = 16
  const gap = 12
  combinedCanvas.width = Math.max(longCanvas.width, shortCanvas.width) + padding * 2
  combinedCanvas.height = longCanvas.height + shortCanvas.height + gap + padding * 2

  const ctx = combinedCanvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)

  const longX = (combinedCanvas.width - longCanvas.width) / 2
  const shortX = (combinedCanvas.width - shortCanvas.width) / 2
  ctx.drawImage(longCanvas, longX, padding)
  ctx.drawImage(shortCanvas, shortX, padding + longCanvas.height + gap)

  return new Promise((resolve, reject) => {
    combinedCanvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      'image/png',
    )
  })
}

async function copyCombinedBarcodeImage(longAscii: string, shortAscii: string): Promise<void> {
  const blob = await createCombinedBarcodeBlob(longAscii, shortAscii)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

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
