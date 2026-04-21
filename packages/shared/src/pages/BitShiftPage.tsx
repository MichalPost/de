import { useState, type KeyboardEvent } from 'react'
import { Card, CardHeader, StatusBar } from '../ui/Card'
import { Button } from '../ui/Button'
import { calculateShift, type ShiftInput, type ShiftResult, type BaseType, type ShiftMethod } from '../lib/bit-shift'
import { ZapIcon } from '../ui/icons'
import { useToast } from '../ui/Toast'
import { InlineChoiceGroup } from '../ui/InlineChoiceGroup'
import { InputField } from '../ui/Field'

const BASE_OPTIONS: { value: BaseType; label: string }[] = [
  { value: '10', label: '10进制 (dec)' },
  { value: '2',  label: '2进制 (bin)' },
  { value: '16', label: '16进制 (hex)' },
]

const SHIFT_OPTIONS = [{ value: 12 }, { value: 10 }]

function ResultRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex h-11 items-center justify-between border-b border-ct-border px-5 last:border-b-0">
      <span className="text-[13px] text-ct-content-secondary">{label}</span>
      <span className={highlight ? 'text-[13px] font-mono font-semibold text-ct-brand-foreground' : 'text-[13px] font-mono text-ct-content-muted'}>
        {value === '' || value === undefined ? '—' : String(value)}
      </span>
    </div>
  )
}

export function BitShiftPage() {
  const [number, setNumber] = useState('')
  const [base, setBase] = useState<BaseType>('10')
  const [shift, setShift] = useState(12)
  const [method, setMethod] = useState<ShiftMethod>('>>')
  const [padding, setPadding] = useState<0 | 1>(0)
  const [result, setResult] = useState<ShiftResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const calculate = (overrideShift?: number) => {
    const s = overrideShift ?? shift
    try {
      const r = calculateShift({ number, base, shift: s, method, padding } as ShiftInput)
      setResult(r)
      setError(null)
      navigator.clipboard.writeText(String(r.decResult)).catch(() => {})
      showToast('已复制十进制结果')
    } catch (e) {
      setError((e as Error).message)
      setResult(null)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) calculate()
  }

  const clear = () => {
    setNumber(''); setBase('10'); setShift(12); setMethod('>>'); setPadding(0)
    setResult(null); setError(null)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 p-3 md:p-5 min-h-full">
      {/* 左侧：参数输入 */}
      <Card className="flex-1 flex flex-col min-h-0 min-w-0">
        <CardHeader tag={{ label: 'SHIFT', color: 'indigo' }} title="参数输入" />
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          {error
            ? <StatusBar color="indigo"><span className="text-ct-danger-foreground">{error}</span></StatusBar>
            : <StatusBar color="indigo">选择进制和移位方式后点击计算，结果将同步显示。</StatusBar>
          }

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <InputField
                label="原数"
                id="bit-shift-number"
                type="text"
                value={number}
                onChange={setNumber}
                onKeyDown={handleKeyDown}
                placeholder="请输入数字"
                mono
              />
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-ct-content-muted">原数类型</span>
              <InlineChoiceGroup
                options={BASE_OPTIONS}
                value={base}
                onChange={(value) => setBase(value as BaseType)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-ct-content-muted">移位数</span>
              <InlineChoiceGroup
                options={SHIFT_OPTIONS.map((o) => ({ value: String(o.value), label: String(o.value) }))}
                value={String(shift)}
                onChange={(value) => setShift(Number(value))}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-ct-content-muted">计算方式</span>
              <InlineChoiceGroup
                options={[
                  { value: '>>', label: '右移 (>>)' },
                  { value: '<<', label: '左移 (<<)' },
                ]}
                value={method}
                onChange={(value) => setMethod(value as ShiftMethod)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-ct-content-muted">新位补数</span>
              <InlineChoiceGroup
                options={[
                  { value: '0', label: '补 0' },
                  { value: '1', label: '补 1' },
                ]}
                value={String(padding)}
                onChange={(value) => setPadding(Number(value) as 0 | 1)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
            <Button variant="ghost" size="md" onClick={() => { setShift(10); calculate(10) }} className="justify-center" fullWidth>仪器</Button>
            <Button variant="ghost" size="md" onClick={() => { setShift(12); calculate(12) }} className="justify-center" fullWidth>试剂包</Button>
            <Button variant="primary" size="md" onClick={() => calculate()} className="col-span-2 sm:col-span-1 justify-center" fullWidth>
              <ZapIcon /> 计算
            </Button>
            <Button variant="ghost" size="md" onClick={clear} className="justify-center" fullWidth>清除</Button>
          </div>
        </div>
      </Card>

      {/* 右侧：结果 + 说明 */}
      <div className="lg:w-[380px] xl:w-[420px] flex flex-col gap-5 min-w-0">
        <Card className="flex flex-col min-h-0">
          <CardHeader tag={{ label: 'RESULT', color: 'amber' }} title="计算结果" />
          <div className="py-1">
            <ResultRow label="2进制 (原数)"  value={result?.binOriginal ?? ''} />
            <ResultRow label="2进制 (结果)"  value={result?.binResult ?? ''}  highlight />
            <ResultRow label="16进制 (原数)" value={result?.hexOriginal ?? ''} />
            <ResultRow label="16进制 (结果)" value={result?.hexResult ?? ''}  highlight />
            <ResultRow label="10进制 (原数)" value={result?.decOriginal ?? ''} />
            <ResultRow label="10进制 (结果)" value={result?.decResult ?? ''}  highlight />
          </div>
        </Card>
      </div>
    </div>
  )
}
