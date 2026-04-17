import { useState, useCallback } from 'react'

interface Props {
  agentValue: string
  customerValue: string
  onAgentChange: (v: string) => void
  onCustomerChange: (v: string) => void
  agentLabel?: string
  customerLabel?: string
}

function parseCustomerCode(raw: string): { agentId: number; customerId: number } | null {
  const s = raw.trim()
  const dotMatch = s.match(/^(\d{1,4})\.(\d{1,5})$/)
  if (dotMatch) return { agentId: parseInt(dotMatch[1], 10), customerId: parseInt(dotMatch[2], 10) }
  const plainMatch = s.match(/^(\d{4})(\d{5})$/)
  if (plainMatch) return { agentId: parseInt(plainMatch[1], 10), customerId: parseInt(plainMatch[2], 10) }
  return null
}

const inputCls = 'h-9 w-full px-3 rounded-xl border text-[13px] font-mono outline-none transition-colors focus:ring-2'

export function CustomerCodeInput({
  agentValue, customerValue, onAgentChange, onCustomerChange,
  agentLabel = '代理商（4位）', customerLabel = '客户编号（5位）',
}: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const handle = useCallback((raw: string) => {
    setCode(raw)
    setOk(false)
    if (!raw.trim()) { setError(null); return }
    const parsed = parseCustomerCode(raw)
    if (!parsed) { setError('格式错误，请输入 XXXX.YYYYY 或 9 位纯数字'); return }
    if (parsed.agentId > 9999) { setError('代理商最大 9999'); return }
    if (parsed.customerId > 99999) { setError('客户编号最大 99999'); return }
    setError(null)
    setOk(true)
    onAgentChange(String(parsed.agentId).padStart(4, '0'))
    onCustomerChange(String(parsed.customerId).padStart(5, '0'))
  }, [onAgentChange, onCustomerChange])

  return (
    <div
      className="p-3 rounded-xl border flex flex-col gap-2"
      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
    >
      <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        客户码快捷填入
      </p>
      <div className="flex flex-col gap-3">
        {/* Quick input */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label htmlFor="customerCodeQuick" className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            客户码 <span style={{ color: 'var(--text-faint)' }}>（0000.01234 或 000012345）</span>
          </label>
          <div className="relative">
            <input
              id="customerCodeQuick"
              type="text"
              value={code}
              onChange={e => handle(e.target.value)}
              placeholder="0000.01234"
              className={inputCls}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: error ? 'var(--error)' : ok ? 'var(--success)' : 'var(--border-input)',
                color: 'var(--text-primary)',
              }}
            />
            {ok && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--success-text)' }}>
                <CheckIcon />
              </span>
            )}
          </div>
          {error && <p className="text-[11px]" style={{ color: 'var(--error-text)' }}>{error}</p>}
        </div>

        {/* Derived fields */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{agentLabel}</span>
            <input
              type="number" min={0} max={9999}
              value={agentValue}
              onChange={e => onAgentChange(e.target.value)}
              className={inputCls}
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{customerLabel}</span>
            <input
              type="number" min={0} max={99999}
              value={customerValue}
              onChange={e => onCustomerChange(e.target.value)}
              className={inputCls}
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

import { CheckIcon } from './icons'
