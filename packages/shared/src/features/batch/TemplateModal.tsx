import { useState } from 'react'
import type { TemplateDefinition } from './types'
import { Button } from '../../ui/Button'

interface Props {
  initial: TemplateDefinition
  onSave: (t: TemplateDefinition) => void
  onSaveAs: (t: TemplateDefinition) => void
  onClose: () => void
}

type F = Omit<TemplateDefinition, 'id' | 'updatedAt'>

const BUSINESS_FIELDS: [keyof F, string, number, number][] = [
  ['storageHalfMonths', '储存半月', 0, 255],
  ['openHalfMonths',    '使用半月', 0, 255],
  ['validUses',         '有效次',   0, 65535],
  ['lotNumber',         '生产批',   0, 65535],
  ['serialNumber',      '起始序号', 0, 65535],
  ['agentId',           '代理商',   0, 9999],
  ['customerId',        '客户编号', 0, 99999],
  ['controlCode',       '控制码',   0, 15],
]

const inputCls = 'outline-none transition-colors focus:ring-2'

export function TemplateModal({ initial, onSave, onSaveAs, onClose }: Props) {
  const [f, setF] = useState<F>({ ...initial })
  const [name, setName] = useState(initial.name)
  const [reagentIdStr, setReagentIdStr] = useState(String(initial.reagentId))

  const set = <K extends keyof F>(k: K, v: F[K]) => setF(p => ({ ...p, [k]: v }))
  const num = (k: keyof F) => (v: string) => {
    if (v === '' || v === '-') return
    const n = Number(v)
    if (!isNaN(n)) set(k, n as F[typeof k])
  }

  const handleReagentIdChange = (v: string) => {
    setReagentIdStr(v)
    const n = parseInt(v, 10)
    if (!isNaN(n) && n >= 0 && n <= 255) set('reagentId', n)
  }

  const toSave = (): TemplateDefinition => ({
    ...f, name: name.trim() || f.name, id: initial.id, updatedAt: Date.now(),
  })

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border-input)',
    color: 'var(--text-primary)',
  }
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div
        className="rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>编辑模板</span>
          <button
            onClick={onClose}
            className="transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >✕</button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>模板名称</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className={`h-9 px-3 rounded-xl border text-[13px] ${inputCls}`}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-input)')}
            />
          </label>

          <div className="flex flex-col gap-2 p-3 rounded-xl border" style={cardStyle}>
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>生成类型</span>
            <div className="flex rounded-xl border overflow-hidden text-[12px]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
              {(['serial', 'list'] as const).map(m => (
                <button key={m} onClick={() => set('genMode', m)}
                  className="flex-1 py-2 font-medium transition-colors cursor-pointer"
                  style={f.genMode === m
                    ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }
                    : { color: 'var(--text-muted)' }
                  }
                  onMouseEnter={e => { if (f.genMode !== m) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
                  onMouseLeave={e => { if (f.genMode !== m) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                >
                  {m === 'serial' ? '序号范围' : '编号列表'}
                </button>
              ))}
            </div>

            {f.genMode === 'serial' ? (
              <div className="flex items-center gap-3 flex-wrap pt-1">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>编号</span>
                  <input type="number" min={0} max={255}
                    value={reagentIdStr}
                    onChange={e => handleReagentIdChange(e.target.value)}
                    className={`h-8 w-20 px-2 rounded-lg border text-[12px] font-mono ${inputCls}`}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-input)')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>生成数量</span>
                  <input type="number" min={1} max={9999} value={f.genCount}
                    onChange={e => set('genCount', Number(e.target.value))}
                    className={`h-8 w-20 px-2 rounded-lg border text-[12px] font-mono ${inputCls}`}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-input)')}
                  />
                </label>
                <span className="text-[11px] pt-4" style={{ color: 'var(--text-muted)' }}>
                  序号 {f.serialNumber} ~ {f.serialNumber + Math.max(0, f.genCount - 1)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>编号列表 · 每行设置打印内容</span>
                <IdListEditor
                  idList={f.genIdList}
                  printConfig={f.printConfig}
                  onIdListChange={v => set('genIdList', v)}
                  onPrintConfigChange={v => set('printConfig', v)}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]"
              style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }}
            >
              <span>📅</span>
              <span>生产日期自动取生成时当天往前一个月，无需手动设置</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUSINESS_FIELDS.map(([k, label, min, max]) => (
                <label key={k} className="flex flex-col gap-1.5">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <input type="number" min={min} max={max} value={String(f[k])}
                    onChange={e => num(k)(e.target.value)}
                    className={`h-9 px-3 rounded-xl border text-[13px] font-mono ${inputCls}`}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-input)')}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 rounded-xl border" style={cardStyle}>
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>序号策略</span>
            <div className="flex gap-3">
              {(['fixed', 'increment'] as const).map(mode => (
                <button key={mode} onClick={() => set('serialMode', mode)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] border transition-colors cursor-pointer"
                  style={f.serialMode === mode
                    ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)', borderColor: 'var(--accent-border)', fontWeight: 500 }
                    : { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                  }
                  onMouseEnter={e => { if (f.serialMode !== mode) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (f.serialMode !== mode) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)' }}
                >
                  <span className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: f.serialMode === mode ? 'var(--accent)' : 'var(--border)' }} />
                  {mode === 'fixed' ? '固定值' : '递增'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="default" onClick={() => onSaveAs(toSave())}>另存为新模板</Button>
          <Button variant="primary" onClick={() => onSave(toSave())}>保存</Button>
        </div>
      </div>
    </div>
  )
}

const PRINT_OPTIONS = [
  { value: 'long',  label: '长码' },
  { value: 'short', label: '短码' },
  { value: 'both',  label: '双码' },
] as const

function IdListEditor({
  idList, printConfig, onIdListChange, onPrintConfigChange,
}: {
  idList: string
  printConfig: string
  onIdListChange: (v: string) => void
  onPrintConfigChange: (v: string) => void
}) {
  const ids = idList.split(/[,，\s\n]+/).map(s => s.trim()).filter(Boolean)
  const configs = printConfig.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean)

  const setConfig = (i: number, val: string) => {
    const arr = ids.map((_, idx) => configs[idx] ?? 'long')
    arr[i] = val
    onPrintConfigChange(arr.join(','))
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        rows={3}
        value={idList}
        onChange={e => onIdListChange(e.target.value)}
        placeholder="57, 58"
        className="px-2 py-2 rounded-lg border text-[12px] font-mono outline-none resize-none"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-input)')}
      />
      {ids.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>每个编号的打印内容</span>
          {ids.map((id, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 text-[12px] font-mono text-right" style={{ color: 'var(--text-primary)' }}>{id}</span>
              <div className="flex rounded-lg border overflow-hidden text-[11px]" style={{ borderColor: 'var(--border)' }}>
                {PRINT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConfig(i, opt.value)}
                    className="px-2.5 py-1 cursor-pointer transition-colors"
                    style={(configs[i] ?? 'long') === opt.value
                      ? { backgroundColor: 'var(--accent)', color: '#fff' }
                      : { backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }
                    }
                    onMouseEnter={e => { if ((configs[i] ?? 'long') !== opt.value) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
                    onMouseLeave={e => { if ((configs[i] ?? 'long') !== opt.value) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
