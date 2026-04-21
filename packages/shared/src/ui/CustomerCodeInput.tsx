import { useState, useCallback } from 'react'
import { InputField, NumberField } from './Field'

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
      className="flex flex-col gap-2 rounded-xl border border-ct-border bg-ct-surface-input p-3"
    >
      <p className="text-[11px] font-semibold tracking-widest uppercase text-ct-content-muted">
        客户码快捷填入
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label htmlFor="customerCodeQuick" className="text-[11px] text-ct-content-muted">
            客户码 <span className="text-ct-content-faint">（0000.01234 或 000012345）</span>
          </label>
          <div className="relative">
            <InputField
              id="customerCodeQuick"
              type="text"
              value={code}
              onChange={handle}
              placeholder="0000.01234"
              className={error ? 'border-ct-danger bg-ct-danger-soft' : ok ? 'border-ct-success bg-ct-surface-card' : 'bg-ct-surface-card'}
              mono
              label=""
            />
            {ok && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ct-success-foreground">
                <CheckIcon />
              </span>
            )}
          </div>
          {error && <p className="text-[11px] text-ct-danger-foreground">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <NumberField
            label={agentLabel}
            id="customer-code-agent"
            min={0}
            max={9999}
            value={agentValue}
            onChange={onAgentChange}
            className="bg-ct-surface-card"
            mono
          />
          <NumberField
            label={customerLabel}
            id="customer-code-customer"
            min={0}
            max={99999}
            value={customerValue}
            onChange={onCustomerChange}
            className="bg-ct-surface-card"
            mono
          />
        </div>
      </div>
    </div>
  )
}

import { CheckIcon } from './icons'
