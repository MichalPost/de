import { useState } from 'react'
import type { TemplateDefinition } from './types'
import { Button } from '../../ui/Button'
import { InputField, NumberField, TextareaField } from '../../ui/Field'
import { SegmentedControl } from '../../ui/SegmentedControl'

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-ct-surface-card shadow-[var(--shadow-md)] sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-ct-border px-5 py-4">
          <span className="text-[15px] font-semibold text-ct-content-primary">编辑模板</span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-ct-content-muted transition-colors hover:text-ct-content-primary"
          >✕</button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
          <InputField label="模板名称" id="template-name" type="text" value={name} onChange={setName} />

          <div className="flex flex-col gap-2 rounded-xl border border-ct-border bg-ct-surface-input p-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-ct-content-muted">生成类型</span>
            <SegmentedControl
              options={[
                { value: 'serial', label: '序号范围' },
                { value: 'list', label: '编号列表' },
              ]}
              value={f.genMode}
              onChange={(value) => set('genMode', value as F['genMode'])}
              className="min-h-10"
            />

            {f.genMode === 'serial' ? (
              <div className="flex items-center gap-3 flex-wrap pt-1">
                <InputField label="编号" id="template-reagent-id" type="number" min={0} max={255} value={reagentIdStr} onChange={handleReagentIdChange} className="h-8 w-20 rounded-lg px-2 text-[12px]" mono />
                <NumberField label="生成数量" id="template-gen-count" min={1} max={9999} value={f.genCount} onChange={(v) => set('genCount', Number(v))} className="h-8 w-20 rounded-lg px-2 text-[12px]" mono />
                <span className="pt-4 text-[11px] text-ct-content-muted">
                  序号 {f.serialNumber} ~ {f.serialNumber + Math.max(0, f.genCount - 1)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] text-ct-content-muted">编号列表 · 每行设置打印内容</span>
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
            <div className="flex items-center gap-2 rounded-xl bg-ct-brand-soft px-3 py-2 text-[11px] text-ct-brand-foreground">
              <span>📅</span>
              <span>生产日期自动取生成时当天往前一个月，无需手动设置</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUSINESS_FIELDS.map(([k, label, min, max]) => (
                <NumberField key={k} label={label} id={`template-field-${String(k)}`} min={min} max={max} value={String(f[k])} onChange={num(k)} mono />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-ct-border bg-ct-surface-input p-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-ct-content-muted">序号策略</span>
            <SegmentedControl
              options={[
                { value: 'fixed', label: '固定值' },
                { value: 'increment', label: '递增' },
              ]}
              value={f.serialMode}
              onChange={(value) => set('serialMode', value as F['serialMode'])}
              className="min-h-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-ct-border px-5 py-4">
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
      <TextareaField label="" id="template-id-list" rows={3} value={idList} onChange={onIdListChange} placeholder="57, 58" className="min-h-0 rounded-lg bg-ct-surface-card px-2 py-2 text-[12px]" mono />
      {ids.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-ct-content-muted">每个编号的打印内容</span>
          {ids.map((id, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 text-right font-mono text-[12px] text-ct-content-primary">{id}</span>
              <SegmentedControl
                options={PRINT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                value={configs[i] ?? 'long'}
                onChange={(value) => setConfig(i, value)}
                className="min-h-8 rounded-lg border-ct-border bg-ct-surface-card p-0.5"
                itemClassName="min-h-7 rounded-md px-2.5 py-1 text-[11px]"
                activeClassName="bg-ct-brand text-white shadow-[var(--shadow-sm)]"
                ariaLabel={`编号 ${id} 的打印内容`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
