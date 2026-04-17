import { useState, type KeyboardEvent } from 'react'
import { Card, CardHeader, StatusBar } from '../ui/Card'
import { Button } from '../ui/Button'
import { calculateShift, type ShiftInput, type ShiftResult, type BaseType, type ShiftMethod } from '../lib/bit-shift'
import { BinaryIcon, ZapIcon } from '../ui/icons'
import { useToast } from '../ui/Toast'

const BASE_OPTIONS: { value: BaseType; label: string }[] = [
  { value: '10', label: '10进制 (dec)' },
  { value: '2',  label: '2进制 (bin)' },
  { value: '16', label: '16进制 (hex)' },
]

const SHIFT_OPTIONS = [{ value: 12 }, { value: 10 }]

function ResultRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
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
            ? <StatusBar color="indigo"><span style={{ color: 'var(--error-text)' }}>{error}</span></StatusBar>
            : <StatusBar color="indigo">选择进制和移位方式后点击计算，结果将同步显示。</StatusBar>
          }

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {/* 原数 */}
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>原数</span>
              <input
                type="text"
                value={number}
                onChange={e => setNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入数字"
                className="h-9 px-3 rounded-xl border text-[13px] font-mono outline-none transition-colors focus:ring-2"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
            </label>

            {/* 原数类型 */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>原数类型</span>
              <select
                value={base}
                onChange={e => setBase(e.target.value as BaseType)}
                className="h-9 px-3 rounded-xl border text-[13px] outline-none"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                {BASE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>

            {/* 移位数 */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>移位数</span>
              <select
                value={shift}
                onChange={e => setShift(Number(e.target.value))}
                className="h-9 px-3 rounded-xl border text-[13px] outline-none"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                {SHIFT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
              </select>
            </label>

            {/* 计算方式 */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>计算方式</span>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as ShiftMethod)}
                className="h-9 px-3 rounded-xl border text-[13px] outline-none"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                <option value=">>">右移 (&gt;&gt;)</option>
                <option value="<<">左移 (&lt;&lt;)</option>
              </select>
            </label>

            {/* 新位补数 */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>新位补数</span>
              <select
                value={padding}
                onChange={e => setPadding(Number(e.target.value) as 0 | 1)}
                className="h-9 px-3 rounded-xl border text-[13px] outline-none"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
              </select>
            </label>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="md" onClick={() => { setShift(10); calculate(10) }}>仪器</Button>
            <Button variant="ghost" size="md" onClick={() => { setShift(12); calculate(12) }}>试剂包</Button>
            <Button variant="primary" size="md" onClick={() => calculate()} className="flex-1 justify-center">
              <ZapIcon /> 计算
            </Button>
            <Button variant="ghost" size="md" onClick={clear}>清除</Button>
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

        <Card>
          <CardHeader tag={{ label: 'INFO', color: 'green' }} title="算法说明" />
          <div className="p-4 flex flex-col gap-2.5">
            {[
              { label: '算法',     value: '自定义位移运算' },
              { label: '支持进制', value: '2 / 10 / 16 进制' },
              { label: '移位方式', value: '左移 (<<) / 右移 (>>)，可指定补位值' },
              { label: '快捷操作', value: '仪器 = 移位10，试剂包 = 移位12' },
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
