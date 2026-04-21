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

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-5 h-11 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span
        className="text-[13px] font-mono"
        style={{ color: highlight ? 'var(--accent-text)' : 'var(--text-muted)', fontWeight: highlight ? 600 : 400 }}
      >
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
            ? <StatusBar color="purple"><span style={{ color: 'var(--error-text)' }}>{error}</span></StatusBar>
            : scanHint
              ? <StatusBar color="purple"><span style={{ color: 'var(--success-text)' }}>✓ {scanHint}</span></StatusBar>
              : <StatusBar color="purple">输入数字和密钥后点击加密或解密，结果将同步显示。</StatusBar>
          }

          <ImageDropZone onFiles={handleScanFiles} scanning={scanning} label="拖入二维码图片自动提取末尾数字并回填解密" />

          {scanRawText && (
            <div className="rounded-2xl border p-3 flex flex-col gap-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>识别详情</span>
                  <button
                    type="button"
                    onClick={copyExtractedNumber}
                    title="复制提取数字"
                    className="text-[11px] font-mono px-2 py-1 rounded-full transition-opacity cursor-pointer"
                    style={{ backgroundColor: 'var(--purple-light)', color: 'var(--purple-text)' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    提取数字 {scanExtractedNumber}
                  </button>
                </div>
                <CopyButton value={scanRawText} />
              </div>
              <div className="flex flex-col gap-1.5 font-mono text-[12px] leading-6">
                {scanRawText.split(/\r?\n/).map((line, index) => {
                  const extracted = scanExtractedNumber ?? ''
                  const markerIndex = extracted ? line.lastIndexOf(extracted) : -1
                  return (
                    <div key={`${index}-${line}`} className="rounded-xl px-3 py-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                      <span className="mr-2 text-[10px] align-middle" style={{ color: 'var(--text-faint)' }}>{String(index + 1).padStart(2, '0')}</span>
                      {markerIndex >= 0 ? (
                        <>
                          <span>{line.slice(0, markerIndex)}</span>
                          <span className="px-1 rounded-md" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }}>
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
            {/* 输入数字 */}
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>输入数字</span>
              <input
                type="text"
                value={number}
                onChange={e => { setNumber(e.target.value); setScanHint(null) }}
                onKeyDown={handleKeyDown}
                placeholder="请输入要处理的数字"
                className="h-9 px-3 rounded-xl border text-[13px] font-mono outline-none transition-colors focus:ring-2"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
            </label>

            {/* 操作类型 */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>操作类型</span>
              <select
                value={operation}
                onChange={e => { setOperation(e.target.value as 'encrypt' | 'decrypt'); setScanHint(null) }}
                className="h-9 px-3 rounded-xl border text-[13px] outline-none"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                <option value="decrypt">解密</option>
                <option value="encrypt">加密</option>
              </select>
            </label>

            {/* 逐位密钥 */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>逐位密钥</span>
              <input
                type="number"
                value={digitKey}
                onChange={e => setDigitKey(Number(e.target.value))}
                onKeyDown={handleKeyDown}
                min={0} max={9}
                className="h-9 px-3 rounded-xl border text-[13px] font-mono outline-none"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
            </label>

            {/* 整体密钥 */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>整体密钥</span>
              <input
                type="number"
                value={globalKey}
                onChange={e => setGlobalKey(Number(e.target.value))}
                onKeyDown={handleKeyDown}
                className="h-9 px-3 rounded-xl border text-[13px] font-mono outline-none"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="purple" size="md" onClick={() => runProcess()} className="flex-1 justify-center">
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
                <div key={section.title} className="rounded-2xl border p-3 flex flex-col gap-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{section.title}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.fields.map((field) => (
                      <div
                        key={`${section.title}-${field.label}`}
                        className="group relative flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-shadow hover:shadow-sm"
                        style={{
                          backgroundColor: field.highlight ? 'var(--success-light)' : 'var(--bg-card)',
                          borderColor: field.highlight ? 'var(--success-border)' : 'var(--border)',
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(field.value)
                            .then(() => showToast(`已复制${field.label}`))
                            .catch(() => showToast('复制失败', 'error'))
                        }}
                        title="点击复制"
                      >
                        <span className="text-[11px]" style={{ color: field.highlight ? 'var(--success-text)' : 'var(--text-muted)' }}>{field.label}</span>
                        <span className="text-[14px] font-semibold font-mono break-all" style={{ color: field.highlight ? 'var(--success-text)' : 'var(--text-primary)' }}>
                          {field.value}
                        </span>
                        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" style={{ color: 'var(--text-muted)' }}>复制</span>
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
