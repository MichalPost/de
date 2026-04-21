import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { PanelHeader } from '../ui/PanelHeader'
import { CopyButton } from '../ui/CopyButton'
import { ImageDropZone } from '../ui/ImageDropZone'
import { scanBarcodeFile, classifyBarcode, cleanBarcodeText, toDecodeHex } from '../lib/barcodeReader'
import { decodeLongCode } from '../lib/reagent-code'
import { usePlatformOps } from '../lib/platformOps'
import { twMerge } from 'tailwind-merge'

type DecodeResult = ReturnType<typeof decodeLongCode>

interface ScanRecord {
  id: string
  filename: string
  previewUrl: string
  status: 'ok' | 'error'
  barcodeText: string
  barcodeKind: 'long' | 'short' | 'unknown'
  decoded: DecodeResult | null
  error: string | null
}

export function ScanBatchPage() {
  const [records, setRecords] = useState<ScanRecord[]>([])
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const previewUrlsRef = useRef<Set<string>>(new Set())
  const platform = usePlatformOps()

  // Pre-warm the ZXing WASM module as soon as the page mounts so the first
  // scan doesn't pay the initialisation cost (~200-400ms).
  useEffect(() => {
    import('zxing-wasm/reader').then(m => {
      // Calling readBarcodesFromImageFile with an empty blob triggers WASM init
      // without doing any real work. Errors are expected and ignored.
      m.readBarcodesFromImageFile(new Blob(), {}).catch(() => {})
    })
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    setScanning(true)
    setProgress({ done: 0, total: files.length })
    const newRecords: ScanRecord[] = []

    // Read all files into blobs immediately — platform.readFileAsBlob handles
    // Android's permission-expiry-after-first-await issue transparently.
    const fileData = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        blob: await platform.readFileAsBlob(file),
        previewUrl: URL.createObjectURL(file),
      }))
    )

    for (let i = 0; i < fileData.length; i++) {
      const { name, blob, previewUrl } = fileData[i]
      previewUrlsRef.current.add(previewUrl)
      const id = `${Date.now()}-${i}`

      try {
        const results = await scanBarcodeFile(blob)
        if (results.length === 0) {
          newRecords.push({ id, filename: name, previewUrl, status: 'error', barcodeText: '', barcodeKind: 'unknown', decoded: null, error: '未识别到条码' })
        } else {
          results.forEach((r, ri) => {
            const clean = cleanBarcodeText(r.text)
            const kind = classifyBarcode(r.text)
            const decodeHex = toDecodeHex(r.text)
            let decoded: DecodeResult | null = null
            let decodeError: string | null = null
            if (decodeHex) {
              try { decoded = decodeLongCode(decodeHex) } catch (e) { decodeError = (e as Error).message }
            }
            newRecords.push({
              id: `${id}-${ri}`,
              filename: results.length > 1 ? `${name} #${ri + 1}` : name,
              previewUrl,
              status: decodeError ? 'error' : 'ok',
              barcodeText: clean,
              barcodeKind: kind,
              decoded,
              error: decodeError,
            })
          })
        }
      } catch (e) {
        newRecords.push({ id, filename: name, previewUrl, status: 'error', barcodeText: '', barcodeKind: 'unknown', decoded: null, error: (e as Error).message })
      }
      setProgress({ done: i + 1, total: fileData.length })
    }

    setRecords(prev => [...newRecords, ...prev])
    setScanning(false)
  }, [platform])

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) URL.revokeObjectURL(url)
      previewUrlsRef.current.clear()
    }
  }, [])

  const clearAll = () => {
    for (const url of previewUrlsRef.current) URL.revokeObjectURL(url)
    previewUrlsRef.current.clear()
    setRecords([])
  }

  const okCount = records.filter(r => r.status === 'ok').length
  const errCount = records.filter(r => r.status === 'error').length

  return (
    <div className="flex flex-col gap-4 p-3 md:p-5 min-h-full">
      <Card className="flex flex-col gap-4 p-5">
        <PanelHeader
          tag={{ label: 'SCAN', color: 'purple' }}
          title="批量图片识别"
          bordered={false}
          meta={
            records.length > 0 ? (
              <>
                <span className="text-[11px] text-ct-success-foreground">✓ {okCount} 成功</span>
                {errCount > 0 && <span className="text-[11px] text-ct-danger-foreground">✕ {errCount} 失败</span>}
              </>
            ) : undefined
          }
          actions={
            records.length > 0
              ? <Button variant="ghost" size="sm" onClick={clearAll}>清空</Button>
              : undefined
          }
          className="px-0"
        />

        <ImageDropZone onFiles={handleFiles} multiple scanning={scanning} label="拖入多张图片批量识别 / 点击选择" />

        {scanning && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-ct-content-muted">
              <span>识别进度</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ct-border">
              <motion.div
                className="h-full rounded-full bg-ct-brand"
                animate={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        )}
      </Card>

      {records.length > 0 && (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {records.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.2) }}
              >
                <ScanRecordCard record={r} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {records.length === 0 && !scanning && (
        <div className="flex flex-1 items-center justify-center text-[13px] text-ct-content-muted">
          拖入图片后自动识别并解码
        </div>
      )}
    </div>
  )
}

const FIELD_LABELS: [string, string][] = [
  ['reagentId', '编号'], ['manufactureYear', '生产年'], ['manufactureMonth', '生产月'],
  ['manufactureDay', '生产日'], ['validUses', '有效次'], ['lotNumber', '生产批'],
  ['serialNumber', '序号'], ['agentId', '代理商'], ['customerId', '客户编号'],
]

function ScanRecordCard({ record }: { record: ScanRecord }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={twMerge(
        'overflow-hidden rounded-xl border bg-ct-surface-card shadow-[var(--shadow-card)]',
        record.status === 'ok' ? 'border-ct-border' : 'border-ct-danger-border',
      )}
    >
      <div className="flex items-start gap-2 px-3 py-3 flex-wrap sm:flex-nowrap sm:items-center">
        <img
          src={record.previewUrl} alt={record.filename}
          className="h-9 w-12 shrink-0 rounded-lg border border-ct-border bg-ct-surface-input object-contain sm:h-10 sm:w-14"
        />
        <span
          className={twMerge(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:mt-0',
            record.status === 'ok' ? 'bg-ct-success-soft text-ct-success-foreground' : 'bg-ct-danger-soft text-ct-danger-foreground',
          )}
        >
          {record.status === 'ok' ? '✓' : '✕'}
        </span>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="truncate text-[11px] text-ct-content-muted">{record.filename}</span>
          {record.barcodeText
            ? <span className="truncate text-[12px] font-mono text-ct-content-primary">{record.barcodeText}</span>
            : <span className="text-[12px] text-ct-danger-foreground">{record.error}</span>
          }
        </div>
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
          {record.barcodeKind !== 'unknown' && (
            <span
              className={twMerge(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                record.barcodeKind === 'long' ? 'bg-ct-brand-soft text-ct-brand-foreground' : 'bg-ct-success-soft text-ct-success-foreground',
              )}
            >
              {record.barcodeKind === 'long' ? '长码' : '短码'}
            </span>
          )}
          {record.barcodeText && <CopyButton value={record.barcodeText} />}
          {(record.decoded || record.barcodeKind === 'short') && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="cursor-pointer rounded-md border border-ct-border bg-ct-surface-input px-2 py-1 text-[11px] text-ct-content-secondary transition-colors hover:border-ct-brand hover:text-ct-brand-foreground"
            >
              {expanded ? '收起' : '展开字段'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-ct-border"
          >
            {record.decoded ? (
              <div className="px-3 py-3 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {FIELD_LABELS.map(([key, label]) => {
                  const val = String((record.decoded!.fields as Record<string, unknown>)[key] ?? '')
                  return (
                    <div
                      key={key}
                      className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-ct-border bg-ct-surface-input p-2 transition-colors hover:border-ct-brand"
                      onClick={() => val && navigator.clipboard.writeText(val)}
                      title="点击复制"
                    >
                      <span className="text-[10px] text-ct-content-muted">{label}</span>
                      <span className="text-[13px] font-semibold font-mono text-ct-content-primary">{val || '—'}</span>
                    </div>
                  )
                })}
              </div>
            ) : record.barcodeKind === 'short' ? (
              <div className="flex items-center gap-2 px-4 py-3 text-[12px] text-ct-content-muted">
                <span className="rounded-lg border border-ct-border bg-ct-surface-input px-2 py-1 font-mono text-ct-content-primary">{record.barcodeText}</span>
                <span>短码仅含序号信息，无法解包完整字段</span>
              </div>
            ) : record.error ? (
              <div className="px-4 py-3 text-[12px] text-ct-danger-foreground">{record.error}</div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
