import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import { ImageDropZone } from '../ui/ImageDropZone'
import { scanBarcodeFile, classifyBarcode, cleanBarcodeText, toDecodeHex } from '../lib/barcodeReader'
import { decodeLongCode } from '../lib/reagent-code'
import { usePlatformOps } from '../lib/platformOps'

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
              style={{ backgroundColor: 'var(--purple-light)', color: 'var(--purple-text)' }}
            >SCAN</span>
            <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>批量图片识别</span>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <>
                <span className="text-[11px]" style={{ color: 'var(--success-text)' }}>✓ {okCount} 成功</span>
                {errCount > 0 && <span className="text-[11px]" style={{ color: 'var(--error-text)' }}>✕ {errCount} 失败</span>}
                <Button variant="ghost" size="sm" onClick={clearAll}>清空</Button>
              </>
            )}
          </div>
        </div>

        <ImageDropZone onFiles={handleFiles} multiple scanning={scanning} label="拖入多张图片批量识别 / 点击选择" />

        {scanning && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>识别进度</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
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
        <div className="flex-1 flex items-center justify-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
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
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: record.status === 'ok' ? 'var(--border)' : 'var(--error-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start gap-2 px-3 py-3 flex-wrap sm:flex-nowrap sm:items-center">
        <img
          src={record.previewUrl} alt={record.filename}
          className="w-12 h-9 sm:w-14 sm:h-10 object-contain rounded-lg shrink-0"
          style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}
        />
        <span
          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 sm:mt-0"
          style={record.status === 'ok'
            ? { backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }
            : { backgroundColor: 'var(--error-light)', color: 'var(--error-text)' }
          }
        >
          {record.status === 'ok' ? '✓' : '✕'}
        </span>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{record.filename}</span>
          {record.barcodeText
            ? <span className="text-[12px] font-mono truncate" style={{ color: 'var(--text-primary)' }}>{record.barcodeText}</span>
            : <span className="text-[12px]" style={{ color: 'var(--error-text)' }}>{record.error}</span>
          }
        </div>
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
          {record.barcodeKind !== 'unknown' && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={record.barcodeKind === 'long'
                ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }
                : { backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }
              }
            >
              {record.barcodeKind === 'long' ? '长码' : '短码'}
            </span>
          )}
          {record.barcodeText && <CopyButton value={record.barcodeText} />}
          {(record.decoded || record.barcodeKind === 'short') && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="px-2 py-1 rounded-md text-[11px] border transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
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
            className="overflow-hidden border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            {record.decoded ? (
              <div className="px-3 py-3 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {FIELD_LABELS.map(([key, label]) => {
                  const val = String((record.decoded!.fields as Record<string, unknown>)[key] ?? '')
                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-0.5 p-2 rounded-lg border cursor-pointer transition-colors"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
                      onClick={() => val && navigator.clipboard.writeText(val)}
                      title="点击复制"
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="text-[13px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{val || '—'}</span>
                    </div>
                  )
                })}
              </div>
            ) : record.barcodeKind === 'short' ? (
              <div className="px-4 py-3 flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                <span className="px-2 py-1 rounded-lg border font-mono"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >{record.barcodeText}</span>
                <span>短码仅含序号信息，无法解包完整字段</span>
              </div>
            ) : record.error ? (
              <div className="px-4 py-3 text-[12px]" style={{ color: 'var(--error-text)' }}>{record.error}</div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
