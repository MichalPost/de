import type { BatchGeneratedRecord } from './types'
import { CopyButton, useCopyAsync } from '../../ui/CopyButton'
import { usePlatformOps } from '../../lib/platformOps'
import { barcodeToPngDataUrl } from '../../lib/barcode'
import { motion } from 'motion/react'
import { ImgIcon, CheckIcon } from '../../ui/icons'

export function BatchResultCard({ record, index = 0 }: { record: BatchGeneratedRecord; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3), ease: 'easeOut' }}
      className="flex flex-col gap-3 p-4 rounded-xl border"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }}
          >
            编号 {record.reagentId}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            序号 {record.serialNumber} · 代理商 {String(record.agentId).padStart(4, '0')} · 客户 {String(record.customerId).padStart(5, '0')}
          </span>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>#{record.index}</span>
      </div>

      <div className="flex flex-col gap-3">
        <BarcodeBlock
          label="长码"
          ascii={record.encodedAscii}
          previewUrl={barcodeToPngDataUrl(record.encodedAscii, { width: 1.4, height: 64, margin: 6 })}
          filenameBase={`long_${record.reagentId}_${record.index}`}
        />
        <BarcodeBlock
          label="短码"
          ascii={record.shortAscii}
          previewUrl={barcodeToPngDataUrl(record.shortAscii, { width: 2, height: 64, margin: 6 })}
          filenameBase={`short_${record.reagentId}_${record.index}`}
          compact
        />
      </div>
    </motion.div>
  )
}

function BarcodeBlock({
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

  const ghostStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-muted)',
    borderColor: 'var(--border)',
  }
  const copiedStyle: React.CSSProperties = {
    backgroundColor: 'var(--success-light)',
    color: 'var(--success-text)',
    borderColor: 'var(--success-border)',
  }

  return (
    <div className={`flex flex-col gap-2 ${compact ? '' : 'flex-1 min-w-0'}`}>
      <div className="flex items-center justify-between min-w-0">
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <CopyButton value={ascii} />
          <button
            onClick={handleCopyImg}
            disabled={copying}
            title="复制条码图片"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={copied ? copiedStyle : ghostStyle}
            onMouseEnter={e => { if (!copied) {
              const el = e.currentTarget
              el.style.color = 'var(--accent-text)'
              el.style.borderColor = 'var(--accent)'
              el.style.backgroundColor = 'var(--accent-light)'
            }}}
            onMouseLeave={e => { if (!copied) {
              const el = e.currentTarget
              el.style.color = ghostStyle.color as string
              el.style.borderColor = ghostStyle.borderColor as string
              el.style.backgroundColor = ghostStyle.backgroundColor as string
            }}}
          >
            {copied ? <CheckIcon /> : <ImgIcon />}
            <span className="hidden sm:inline">{copied ? '已复制' : copying ? '复制中…' : '复制图片'}</span>
          </button>
          <button
            onClick={() => platform.downloadBarcodePng(ascii, `${filenameBase}.png`)}
            title="下载 PNG"
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border transition-colors cursor-pointer"
            style={ghostStyle}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.color = 'var(--accent-text)'
              el.style.borderColor = 'var(--accent)'
              el.style.backgroundColor = 'var(--accent-light)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.color = ghostStyle.color as string
              el.style.borderColor = ghostStyle.borderColor as string
              el.style.backgroundColor = ghostStyle.backgroundColor as string
            }}
          >PNG</button>
        </div>
      </div>
      <div
        className="flex flex-col items-center rounded-lg border p-2"
        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', minHeight: compact ? 72 : 80 }}
      >
        <img src={previewUrl} alt={ascii} className="max-w-full" />
      </div>
    </div>
  )
}
