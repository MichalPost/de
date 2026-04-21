import { useState, type KeyboardEvent } from 'react'
import { Card, CardHeader, StatusBar } from '../ui/Card'
import { Button } from '../ui/Button'
import { processDigitCrypto, type CryptoResult } from '../lib/digit-crypto'
import { LockIcon, UnlockIcon } from '../ui/icons'
import { useToast } from '../ui/Toast'
import { ImageDropZone } from '../ui/ImageDropZone'
import { extractTrailingDigits, scanBarcodeFile } from '../lib/barcodeReader'
import { usePlatformOps } from '../lib/platformOps'
import { CopyButton } from '../ui/CopyButton'
import { parseQrPayload, type ParsedQrPayload } from '../lib/qr-payload'
import { InlineChoiceGroup } from '../ui/InlineChoiceGroup'
import { InputField, NumberField } from '../ui/Field'

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex h-11 items-center justify-between border-b border-ct-border px-5 last:border-b-0">
      <span className="text-[13px] text-ct-content-secondary">{label}</span>
      <span className={highlight ? 'text-[13px] font-mono font-semibold text-ct-brand-foreground' : 'text-[13px] font-mono text-ct-content-muted'}>
        {value || '—'}
      </span>
    </div>
  )
}

export function DigitCryptoPage() {
  const [number, setNumber] = useState('')
  const [digitKey, setDigitKey] = useState(7)
  const [globalKey, setGlobalKey] = useState(12345)
  const [operation, setOperation] = useState<'encrypt' | 'decrypt'>('decrypt')
  const [result, setResult] = useState<CryptoResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanHint, setScanHint] = useState<string | null>(null)
  const [scanRawText, setScanRawText] = useState<string | null>(null)
  const [scanExtractedNumber, setScanExtractedNumber] = useState<string | null>(null)
  const [parsedQrPayload, setParsedQrPayload] = useState<ParsedQrPayload | null>(null)
  const { showToast } = useToast()
  const platform = usePlatformOps()
  const dropzoneScanning = scanning && !scanHint && !scanRawText && !error

  const copyExtractedNumber = () => {
    if (!scanExtractedNumber) return
    navigator.clipboard.writeText(scanExtractedNumber)
      .then(() => showToast('已复制提取数字'))
      .catch(() => showToast('复制失败', 'error'))
  }

  const runProcess = (nextNumber = number, nextOperation = operation) => {
    try {
      const r = processDigitCrypto({ number: nextNumber, digitKey, globalKey, operation: nextOperation })
      setResult(r)
      setError(null)
      const toCopy = nextOperation === 'encrypt' ? r.finalResult : r.decryptedResult
      navigator.clipboard.writeText(toCopy).catch(() => {})
      showToast('已复制结果')
    } catch (e) {
      setError((e as Error).message)
      setResult(null)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) runProcess()
  }

  const handleScanFiles = async (files: File[]) => {
    setScanning(true)
    setScanHint(null)
    setError(null)
    try {
      const blob = await platform.readFileAsBlob(files[0])
      const results = await scanBarcodeFile(blob)
      if (results.length === 0) throw new Error('未识别到二维码或条码，请确保图片清晰且二维码完整')

      const best = results.find(r => r.format === 'QRCode') ?? results[0]
      const extracted = extractTrailingDigits(best.text)
      if (!extracted) throw new Error('二维码内容中未找到可用于解密的末尾数字')

      setScanRawText(best.text)
      setScanExtractedNumber(extracted)
      setParsedQrPayload(parseQrPayload(best.text))
      setNumber(extracted)
      setOperation('decrypt')
      setScanHint(`已识别二维码，提取加密数字 ${extracted} 并自动解密`)
      runProcess(extracted, 'decrypt')
    } catch (e) {
      setError(`识别失败: ${(e as Error).message}`)
      setScanRawText(null)
      setScanExtractedNumber(null)
      setParsedQrPayload(null)
    } finally {
      setScanning(false)
    }
  }

  const clear = () => {
    setNumber(''); setDigitKey(7); setGlobalKey(12345); setOperation('decrypt')
    setResult(null); setError(null); setScanHint(null); setScanRawText(null); setScanExtractedNumber(null); setParsedQrPayload(null)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 p-3 md:p-5 min-h-full">
      {/* 左侧：参数输入 */}
      <Card className="flex-1 flex flex-col min-h-0 min-w-0">
        <CardHeader tag={{ label: 'CRYPTO', color: 'purple' }} title="参数输入" />
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          {error
            ? <StatusBar color="purple"><span className="text-ct-danger-foreground">{error}</span></StatusBar>
            : scanHint
              ? <StatusBar color="purple"><span className="text-ct-success-foreground">✓ {scanHint}</span></StatusBar>
              : <StatusBar color="purple">输入数字和密钥后点击加密或解密，结果将同步显示。</StatusBar>
          }

          <ImageDropZone onFiles={handleScanFiles} scanning={dropzoneScanning} label="拖入二维码图片自动提取末尾数字并回填解密" />

          {scanRawText && (
            <div className="flex flex-col gap-2 rounded-2xl border border-ct-border bg-ct-surface-input p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ct-content-muted">识别详情</span>
                  <Button
                    onClick={copyExtractedNumber}
                    variant="purple"
                    size="sm"
                    className="rounded-full font-mono"
                  >
                    提取数字 {scanExtractedNumber}
                  </Button>
                </div>
                <CopyButton value={scanRawText} />
              </div>
              <div className="flex flex-col gap-1.5 font-mono text-[12px] leading-6">
                {scanRawText.split(/\r?\n/).map((line, index) => {
                  const extracted = scanExtractedNumber ?? ''
                  const markerIndex = extracted ? line.lastIndexOf(extracted) : -1
                  return (
                    <div key={`${index}-${line}`} className="rounded-xl border border-ct-border bg-ct-surface-card px-3 py-2 text-ct-content-secondary">
                      <span className="mr-2 align-middle text-[10px] text-ct-content-faint">{String(index + 1).padStart(2, '0')}</span>
                      {markerIndex >= 0 ? (
                        <>
                          <span>{line.slice(0, markerIndex)}</span>
                          <span className="rounded-md bg-ct-success-soft px-1 text-ct-success-foreground">
                            {extracted}
                          </span>
                          <span>{line.slice(markerIndex + extracted.length)}</span>
                        </>
                      ) : (
                        <span>{line}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <InputField
                label="输入数字"
                id="digit-crypto-number"
                value={number}
                type="text"
                onChange={(value) => { setNumber(value); setScanHint(null) }}
                onKeyDown={handleKeyDown}
                placeholder="请输入要处理的数字"
                mono
              />
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-ct-content-muted">操作类型</span>
              <InlineChoiceGroup
                options={[
                  { value: 'decrypt', label: '解密' },
                  { value: 'encrypt', label: '加密' },
                ]}
                value={operation}
                onChange={(value) => { setOperation(value as 'encrypt' | 'decrypt'); setScanHint(null) }}
              />
            </label>

            <div>
              <NumberField
                label="逐位密钥"
                id="digit-crypto-digit-key"
                value={digitKey}
                onChange={(value) => setDigitKey(Number(value))}
                onKeyDown={handleKeyDown}
                min={0}
                max={9}
                mono
              />
            </div>

            <div>
              <NumberField
                label="整体密钥"
                id="digit-crypto-global-key"
                value={globalKey}
                onChange={(value) => setGlobalKey(Number(value))}
                onKeyDown={handleKeyDown}
                mono
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="purple" size="md" onClick={() => runProcess()} className="flex-1 justify-center" fullWidth>
              {operation === 'encrypt' ? <LockIcon /> : <UnlockIcon />}
              {operation === 'encrypt' ? '加密' : '解密'}
            </Button>
            <Button variant="ghost" size="md" onClick={clear}>清除</Button>
          </div>
        </div>
      </Card>

      {/* 右侧：结果 + 说明 */}
      <div className="lg:w-[380px] xl:w-[420px] flex flex-col gap-5 min-w-0">
        {parsedQrPayload && (
          <Card className="flex flex-col min-h-0">
            <CardHeader tag={{ label: parsedQrPayload.kind === 'instrument' ? 'DEVICE' : 'PACKAGE', color: 'green' }} title={parsedQrPayload.title} />
            <div className="p-4 flex flex-col gap-3">
              {parsedQrPayload.sections.map((section) => (
                <div key={section.title} className="flex flex-col gap-2 rounded-2xl border border-ct-border bg-ct-surface-input p-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ct-content-muted">{section.title}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.fields.map((field) => (
                      <div
                        key={`${section.title}-${field.label}`}
                        className={
                          field.highlight
                            ? 'group relative flex cursor-pointer flex-col gap-1 rounded-xl border border-ct-success-border bg-ct-success-soft p-3 transition-shadow hover:shadow-sm'
                            : 'group relative flex cursor-pointer flex-col gap-1 rounded-xl border border-ct-border bg-ct-surface-card p-3 transition-shadow hover:shadow-sm'
                        }
                        onClick={() => {
                          navigator.clipboard.writeText(field.value)
                            .then(() => showToast(`已复制${field.label}`))
                            .catch(() => showToast('复制失败', 'error'))
                        }}
                        title="点击复制"
                      >
                        <span className={field.highlight ? 'text-[11px] text-ct-success-foreground' : 'text-[11px] text-ct-content-muted'}>{field.label}</span>
                        <span className={field.highlight ? 'break-all font-mono text-[14px] font-semibold text-ct-success-foreground' : 'break-all font-mono text-[14px] font-semibold text-ct-content-primary'}>
                          {field.value}
                        </span>
                        <span className="absolute top-2 right-2 text-[10px] text-ct-content-muted opacity-0 transition-opacity group-hover:opacity-100">复制</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="flex flex-col min-h-0">
          <CardHeader tag={{ label: 'RESULT', color: 'amber' }} title="处理结果" />
          <div className="py-1">
            <ResultRow label="原始数字"     value={result?.originalNumber ?? ''} />
            <ResultRow label="逐位操作结果" value={result?.digitStepResult ?? ''} />
            <ResultRow label="整体偏移结果" value={result?.globalStepResult ?? ''} />
            <ResultRow label="最终加密结果" value={result?.finalResult ?? ''}     highlight />
            <ResultRow label="解密验证"     value={result?.decryptedResult ?? ''} highlight />
          </div>
        </Card>
      </div>
    </div>
  )
}
