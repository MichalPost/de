import { useState, useCallback, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Card, CardHeader, StatusBar } from '../ui/Card'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import { TextareaField } from '../ui/Field'
import { ImageDropZone } from '../ui/ImageDropZone'
import { decodeLongCode } from '../lib/reagent-code'
import { scanBarcodeFile, classifyBarcode, cleanBarcodeText, toDecodeHex } from '../lib/barcodeReader'
import { LEGACY_FIXTURES } from '../lib/custom-algorithm'
import { ScanIcon } from '../ui/icons'
import { motion, AnimatePresence } from 'motion/react'
import { useToast } from '../ui/Toast'
import { useDecodeHistoryStore } from '../store/decodeHistoryStore'
import { DecodeHistoryDropdown } from '../ui/DecodeHistoryDropdown'
import { usePlatformOps } from '../lib/platformOps'

type DecodeResult = ReturnType<typeof decodeLongCode>

const FIELD_LABELS: Record<string, string> = {
  reagentId: '编号', manufactureYear: '生产年', manufactureMonth: '生产月',
  manufactureDay: '生产日', storageHalfMonths: '储存半月', openHalfMonths: '使用半月',
  validUses: '有效次', lotNumber: '生产批', serialNumber: '序号',
  agentId: '代理商', customerId: '客户编号', controlCode: '控制码', checksumNibble: '校验半字节',
}

export function DecodePage() {
  const [input, setInput] = useState<string>(LEGACY_FIXTURES.decodeSource)
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanHint, setScanHint] = useState<string | null>(null)
  const [decodeOnPaste, setDecodeOnPaste] = useState(false)
  const { showToast } = useToast()
  const { addEntry: addDecodeHistory } = useDecodeHistoryStore()
  const platform = usePlatformOps()

  const runDecode = useCallback((raw: string) => {
    const trimmed = raw.trim()
    try {
      const hex = toDecodeHex(trimmed) ?? trimmed
      const r = decodeLongCode(hex)
      setResult(r)
      setError(null)
      addDecodeHistory({
        raw: trimmed,
        reagentId: r.fields.reagentId,
        serialNumber: r.fields.serialNumber,
        agentId: r.fields.agentId,
        customerId: r.fields.customerId,
      })
    } catch (e) {
      setError((e as Error).message)
      setResult(null)
    }
  }, [addDecodeHistory])

  const decode = useCallback(() => runDecode(input), [input, runDecode])

  const handleInputKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
    e.preventDefault()
    decode()
  }, [decode])

  const handleInputPaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!decodeOnPaste) return
    const text = e.clipboardData.getData('text')
    if (!text) return
    e.preventDefault()
    const clean = cleanBarcodeText(text)
    setInput(clean)
    setScanHint(null)
    runDecode(clean)
  }, [decodeOnPaste, runDecode])

  const handleImageFiles = useCallback(async (files: File[]) => {
    setScanning(true)
    setScanHint(null)
    setError(null)
    try {
      const blob = await platform.readFileAsBlob(files[0])
      const results = await scanBarcodeFile(blob)
      if (results.length === 0) {
        setError('未识别到条码，请确保图片清晰且包含 Code128 条码')
        return
      }
      const long = results.find(r => classifyBarcode(r.text) === 'long')
      const best = long ?? results[0]
      const kind = classifyBarcode(best.text)
      const decodeHex = toDecodeHex(best.text)
      const displayText = decodeHex ?? cleanBarcodeText(best.text)
      setInput(displayText)
      setScanHint(`识别到${kind === 'long' ? '长码' : '短码'}，已自动回填`)
      if (decodeHex) runDecode(decodeHex)
    } catch (e) {
      setError(`识别失败: ${(e as Error).message}`)
    } finally {
      setScanning(false)
    }
  }, [platform, runDecode])

  return (
    <div className="flex flex-col lg:flex-row gap-5 p-3 md:p-5 min-h-full">
      <Card className="flex-1 flex flex-col min-h-0 min-w-0">
        <CardHeader tag={{ label: 'DECODE', color: 'green' }} title="输入长码"
          actions={<DecodeHistoryDropdown onSelect={v => { setInput(v); setScanHint(null); runDecode(v) }} />}
        />
        <div className="flex-1 p-5 flex flex-col gap-4 overflow-auto">
          <StatusBar color="green">
            {error
              ? <span className="text-ct-danger-foreground">{error}</span>
              : scanHint
                ? <span className="text-ct-success-foreground">✓ {scanHint}</span>
                : '默认已载入旧版基准长码，可直接验证迁移结果。'
            }
          </StatusBar>

          <ImageDropZone onFiles={handleImageFiles} scanning={scanning} label="拖入条码图片自动识别并回填" />

          <TextareaField
            label="长码 hex（44字符）或 ASCII（vDFEU… 格式，22字符）"
            id="decodeInput"
            value={input}
            onChange={v => { setInput(v); setScanHint(null) }}
            onKeyDown={handleInputKeyDown}
            onPaste={handleInputPaste}
            mono rows={3}
          />
          <div className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 text-[12px] text-ct-content-secondary">
              <input
                type="checkbox"
                checked={decodeOnPaste}
                onChange={(e) => setDecodeOnPaste(e.target.checked)}
                className="h-4 w-4 rounded border-ct-border-input accent-[var(--success)]"
              />
              粘贴即解码
            </label>
            <Button variant="success" size="md" onClick={decode}>
              <ScanIcon /> 解码
            </Button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {[
                  { label: '旧工具输出 hex', val: result.outputHex },
                  { label: '解包 17 字节',   val: result.unpackedHex },
                ].map(({ label, val }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-ct-content-muted">{label}</span>
                      <CopyButton value={val} />
                    </div>
                    <div className="flex h-9 items-center overflow-hidden rounded-xl border border-ct-border bg-ct-surface-input px-3 font-mono text-[11px] text-ct-content-secondary">
                      <span className="truncate">{val}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <Card className="lg:w-[360px] xl:w-[400px] flex flex-col min-h-0 min-w-0">
        <CardHeader tag={{ label: 'FIELDS', color: 'indigo' }} title="解析字段" />
        <div className="flex-1 overflow-auto p-4">
          {result ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                const val = (result.fields as Record<string, unknown>)[key]
                const valStr = String(val ?? '')
                const highlight = key === 'checksumNibble' || key === 'controlCode'
                return (
                  <div
                    key={key}
                    className={
                      highlight
                        ? 'group relative flex cursor-pointer flex-col gap-1 rounded-xl border border-ct-brand-border bg-ct-brand-soft p-3 transition-shadow hover:shadow-sm'
                        : 'group relative flex cursor-pointer flex-col gap-1 rounded-xl border border-ct-border bg-ct-surface-input p-3 transition-shadow hover:shadow-sm'
                    }
                    onClick={() => {
                      if (!valStr) return
                      navigator.clipboard.writeText(valStr)
                        .then(() => showToast('复制成功'))
                        .catch(() => showToast('复制失败', 'error'))
                    }}
                    title="点击复制"
                  >
                    <span className={highlight ? 'text-[11px] text-ct-brand-foreground' : 'text-[11px] text-ct-content-muted'}>{label}</span>
                    <span className={highlight ? 'text-[18px] font-mono font-semibold text-ct-brand-foreground' : 'text-[18px] font-mono font-semibold text-ct-content-primary'}>
                      {valStr || '—'}
                    </span>
                    <span className="absolute top-2 right-2 text-[10px] text-ct-content-muted opacity-0 transition-opacity group-hover:opacity-100">复制</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] text-ct-content-muted">
              输入长码后点击解码
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
