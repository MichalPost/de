import { useState, type KeyboardEvent } from 'react'
import { Card, CardHeader, StatusBar } from '@chemtools/shared/ui/Card'
import { Button } from '@chemtools/shared/ui/Button'
import { processDigitCrypto, type CryptoResult } from '@chemtools/shared/lib/digit-crypto'
import { LockIcon, UnlockIcon } from '@chemtools/shared/ui/icons'
import { useToast } from '@chemtools/shared/ui/Toast'

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
  const { showToast } = useToast()

  const process = () => {
    try {
      const r = processDigitCrypto({ number, digitKey, globalKey, operation })
      setResult(r)
      setError(null)
      const toCopy = operation === 'encrypt' ? r.finalResult : r.decryptedResult
      navigator.clipboard.writeText(toCopy).catch(() => {})
      showToast('已复制结果')
    } catch (e) {
      setError((e as Error).message)
      setResult(null)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) process()
  }

  const clear = () => {
    setNumber(''); setDigitKey(7); setGlobalKey(12345); setOperation('decrypt')
    setResult(null); setError(null)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 p-3 md:p-5 min-h-full">
      {/* 左侧：参数输入 */}
      <Card className="flex-1 flex flex-col min-h-0 min-w-0">
        <CardHeader tag={{ label: 'CRYPTO', color: 'purple' }} title="参数输入" />
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          {error
            ? <StatusBar color="purple"><span style={{ color: 'var(--error-text)' }}>{error}</span></StatusBar>
            : <StatusBar color="purple">输入数字和密钥后点击加密或解密，结果将同步显示。</StatusBar>
          }

          <div className="grid grid-cols-2 gap-3">
            {/* 输入数字 */}
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>输入数字</span>
              <input
                type="text"
                value={number}
                onChange={e => setNumber(e.target.value)}
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
                onChange={e => setOperation(e.target.value as 'encrypt' | 'decrypt')}
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
            <Button variant="purple" size="md" onClick={process} className="flex-1 justify-center">
              {operation === 'encrypt' ? <LockIcon /> : <UnlockIcon />}
              {operation === 'encrypt' ? '加密' : '解密'}
            </Button>
            <Button variant="ghost" size="md" onClick={clear}>清除</Button>
          </div>
        </div>
      </Card>

      {/* 右侧：结果 + 说明 */}
      <div className="lg:w-[380px] xl:w-[420px] flex flex-col gap-5 min-w-0">
        <Card className="flex flex-col min-h-0">
          <CardHeader tag={{ label: 'RESULT', color: 'amber' }} title="处理结果" />
          <div className="py-1">
            <ResultRow label="原始数字"     value={result?.originalNumber ?? ''} />
            <ResultRow label="逐位加密结果" value={result?.digitEncrypted ?? ''} />
            <ResultRow label="整体加密结果" value={result?.globalEncrypted ?? ''} />
            <ResultRow label="最终加密结果" value={result?.finalResult ?? ''}     highlight />
            <ResultRow label="解密验证"     value={result?.decryptedResult ?? ''} highlight />
          </div>
        </Card>

        <Card>
          <CardHeader tag={{ label: 'INFO', color: 'green' }} title="算法说明" />
          <div className="p-4 flex flex-col gap-2.5">
            {[
              { label: '算法',     value: '逐位加密 + 整体偏移' },
              { label: '步骤一',   value: '每位数字 + 逐位密钥 (mod 10)' },
              { label: '步骤二',   value: '整体数字 + 整体密钥' },
              { label: '默认密钥', value: '逐位密钥 = 7，整体密钥 = 12345' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1 p-3 rounded-xl border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
