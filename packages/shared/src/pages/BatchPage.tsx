import { useCallback, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Card, CardHeader, StatusBar } from '../ui/Card'
import { Button } from '../ui/Field'
import { CustomerCodeInput } from '../ui/CustomerCodeInput'
import { createTemplate, getDefaultTemplateDefinition } from '../features/batch/templateStore'
import { buildBatchCodes, parseReagentIds } from '../features/batch/batchEngine'
import { exportResultsAsPng, copyResultsAsImage, exportResultsAsPdf, MAX_PAGES_PER_PNG } from '../features/batch/exportBatch'
import { TemplateModal } from '../features/batch/TemplateModal'
import { BatchResultCard } from '../features/batch/BatchResultCard'
import { BatchHistoryPanel } from '../features/batch/BatchHistoryPanel'
import { PrintLayout } from '../features/batch/PrintLayout'
import { useResultFilter } from '../features/batch/useResultFilter'
import { useCopyAsync } from '../ui/CopyButton'
import { useToast } from '../ui/Toast'
import { useTemplateStore } from '../store/templateStore'
import { useBatchDataStore } from '../store/batchDataStore'
import { useBatchUIStore } from '../store/batchUIStore'
import { useHistoryStore } from '../store/historyStore'
import type { BatchHistoryEntry, TemplateDefinition } from '../features/batch/types'
import type { BatchGeneratedRecord } from '../features/batch/types'

type PrintMode = 'long' | 'short' | 'both' | 'auto'
type ViewMode = 'preview' | 'print'

export function BatchPage() {
  const { templates, activeId, setActiveId, addTemplate, updateTemplate, deleteTemplate } = useTemplateStore()
  const {
    records, error, running,
    agentOverride, customerOverride, serialCountOverride, validUsesOverride,
    preserveOverridesOnTemplateSwitch,
    setRecords, setError, setRunning,
    setAgentOverride, setCustomerOverride, setSerialCountOverride, setValidUsesOverride, setPreserveOverridesOnTemplateSwitch,
  } = useBatchDataStore()
  const {
    viewMode, printMode, printCols, printPerPage, currentPage,
    setViewMode, setPrintMode, setPrintCols, setPrintPerPage, setCurrentPage,
  } = useBatchUIStore()

  const [editingTemplate, setEditingTemplate] = useState<TemplateDefinition | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const copyImageState = useCopyAsync()
  const { showToast } = useToast()
  const { addEntry } = useHistoryStore()

  const activeTemplate = templates.find(t => t.id === activeId) ?? templates[0]
  const totalPages = Math.max(1, Math.ceil(records.length / printPerPage))
  const currentPageRecords = records.slice(currentPage * printPerPage, (currentPage + 1) * printPerPage)
  const effectiveMode = printMode === 'auto' ? undefined : printMode as 'long' | 'short' | 'both'

  const handleSave = (t: TemplateDefinition) => { updateTemplate(t); setEditingTemplate(null) }
  const handleSaveAs = (t: TemplateDefinition) => {
    const existingNames = new Set(templates.map(tpl => tpl.name))
    let newName = t.name
    if (existingNames.has(newName)) {
      const base = `${t.name} 副本`
      newName = base
      let n = 2
      while (existingNames.has(newName)) {
        newName = `${base} ${n++}`
      }
    }
    addTemplate({ ...t, name: newName })
    setEditingTemplate(null)
  }
  const handleDelete = (id: string) => deleteTemplate(id)
  const handleNewTemplate = () => {
    setIsNew(true)
    setEditingTemplate({ ...getDefaultTemplateDefinition(), id: '__new__', name: '新模板' })
  }
  const handleSaveNew = (t: TemplateDefinition) => {
    addTemplate(createTemplate(t))
    setEditingTemplate(null)
    setIsNew(false)
  }

  const handleGenerate = useCallback(() => {
    setError(null)
    setRunning(true)
    setTimeout(() => {
      try {
        const overrides = {
          agentIdOverride: agentOverride.trim() ? Number(agentOverride) : undefined,
          customerIdOverride: customerOverride.trim() ? Number(customerOverride) : undefined,
          validUsesOverride: validUsesOverride.trim() ? Number(validUsesOverride) : undefined,
        }
        if (activeTemplate.genMode === 'serial') {
          const count = serialCountOverride.trim() ? parseInt(serialCountOverride, 10) : activeTemplate.genCount
          if (isNaN(count) || count < 1) throw new Error('数量至少为 1')
          const reagentIds = Array.from({ length: count }, () => activeTemplate.reagentId)
          const result = buildBatchCodes({ ...activeTemplate, serialMode: 'increment' as const }, { reagentIds, ...overrides })
          setRecords(result)
          addEntry({ templateName: activeTemplate.name, recordCount: result.length, records: result, printMode, printCols, printPerPage })
        } else {
          const reagentIds = parseReagentIds(activeTemplate.genIdList)
          if (reagentIds.length === 0) throw new Error('编号列表为空，请先编辑模板')
          const result = buildBatchCodes(activeTemplate, { reagentIds, ...overrides })
          setRecords(result)
          addEntry({ templateName: activeTemplate.name, recordCount: result.length, records: result, printMode, printCols, printPerPage })
        }
        setError(null)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setRunning(false)
      }
    }, 0)
  }, [agentOverride, customerOverride, serialCountOverride, validUsesOverride, activeTemplate, printMode, printCols, printPerPage, setRecords, setError, setRunning, addEntry])

  const handleExportPng = async () => {
    try {
      setError(null)
      const tp = Math.max(1, Math.ceil(records.length / printPerPage))
      if (tp > MAX_PAGES_PER_PNG) showToast(`条码长图将按最多?${MAX_PAGES_PER_PNG} 页分批导出，避免内存峰值。`)
      await exportResultsAsPng(records, effectiveMode, printCols, printPerPage,
        `批量生成_${activeTemplate.name}_${new Date().toISOString().slice(0, 10)}.png`)
    } catch (e) { setError((e as Error).message) }
  }
  const handleCopyImage = () =>
    copyImageState.copy(() => copyResultsAsImage(records, effectiveMode, printCols, printPerPage))
      .catch(e => setError((e as Error).message))
  const handleExportPdf = async () => {
    try {
      setError(null)
      await exportResultsAsPdf(records, effectiveMode, printCols, printPerPage, activeTemplate.name)
    } catch (e) { setError((e as Error).message) }
  }

  const handleRestoreHistory = useCallback((entry: BatchHistoryEntry) => {
    setRecords(entry.records)
    setPrintMode(entry.printMode)
    setPrintCols(entry.printCols)
    setPrintPerPage(entry.printPerPage)
    setHistoryOpen(false)
  }, [setRecords, setPrintMode, setPrintCols, setPrintPerPage])

  return (
    <div className="flex flex-col lg:flex-row gap-3 p-3 md:p-4 lg:h-full lg:min-h-0">
      {/* md: template + input side by side; lg: all three side by side */}
      <div className="flex flex-col md:flex-row lg:contents gap-3">
        <TemplatePanel
          templates={templates} activeId={activeId}
          onSelect={(id) => {
            setActiveId(id)
            if (!preserveOverridesOnTemplateSwitch) {
              setAgentOverride(''); setCustomerOverride('')
              setSerialCountOverride(''); setValidUsesOverride('')
            }
          }}
          onEdit={(t) => { setIsNew(false); setEditingTemplate(t) }}
          onDelete={handleDelete}
          onNew={handleNewTemplate}
        />

        <InputPanel
          activeTemplate={activeTemplate}
          agentOverride={agentOverride} customerOverride={customerOverride}
          serialCountOverride={serialCountOverride} validUsesOverride={validUsesOverride}
          preserveOverridesOnTemplateSwitch={preserveOverridesOnTemplateSwitch}
          onAgentChange={setAgentOverride} onCustomerChange={setCustomerOverride}
          onSerialCountChange={setSerialCountOverride} onValidUsesChange={setValidUsesOverride}
          onPreserveOverridesSwitch={setPreserveOverridesOnTemplateSwitch}
          running={running} error={error}
          onGenerate={handleGenerate}
        />
      </div>

      <ResultPanel
        records={records} currentPageRecords={currentPageRecords}
        viewMode={viewMode} printMode={printMode}
        printCols={printCols} printPerPage={printPerPage}
        currentPage={currentPage} totalPages={totalPages}
        copyImageState={copyImageState}
        onViewMode={setViewMode} onPrintMode={setPrintMode}
        onCols={setPrintCols} onPerPage={setPrintPerPage}
        onPage={setCurrentPage}
        onCopyImage={handleCopyImage}
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      <BatchHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} onRestore={handleRestoreHistory} />

      {editingTemplate && (
        <TemplateModal
          initial={editingTemplate}
          onSave={isNew ? handleSaveNew : handleSave}
          onSaveAs={handleSaveAs}
          onClose={() => { setEditingTemplate(null); setIsNew(false) }}
        />
      )}
    </div>
  )
}

// ── TemplatePanel ─────────────────────────────────────────────────────────────
function TemplatePanel({ templates, activeId, onSelect, onEdit, onDelete, onNew }: {
  templates: TemplateDefinition[]
  activeId: string
  onSelect: (id: string) => void
  onEdit: (t: TemplateDefinition) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  return (
    <Card className="md:flex-1 lg:w-[260px] lg:flex-none shrink-0 flex flex-col lg:min-h-0">
      <CardHeader
        tag={{ label: 'TEMPLATE', color: 'indigo' }}
        title="模板中心"
        actions={<Button variant="primary" size="sm" onClick={onNew}><PlusIcon /> 新建</Button>}
      />
      <div className="lg:flex-1 lg:overflow-auto p-3 flex flex-col gap-2">
        {templates.map(t => (
          <div
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="group flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-colors"
            style={{
              backgroundColor: t.id === activeId ? 'var(--accent-light)' : 'var(--bg-input)',
              borderColor: t.id === activeId ? 'var(--accent-border)' : 'var(--border)',
            }}
            onMouseEnter={e => { if (t.id !== activeId) (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)' }}
            onMouseLeave={e => { if (t.id !== activeId) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span
                className="text-[13px] font-medium truncate"
                style={{ color: t.id === activeId ? 'var(--accent-text)' : 'var(--text-primary)' }}
              >{t.name}</span>
              <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {t.genMode === 'serial' ? `序号范围 · 编号 ${t.reagentId} · ${t.genCount} 条` : `编号列表 · ${t.genIdList || '未设置'}`}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              <button
                onClick={e => { e.stopPropagation(); onEdit(t) }}
                className="px-2 py-0.5 rounded-md text-[11px] border transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--accent-text)' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)' }}
              >编辑</button>
              {templates.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(t.id) }}
                  className="px-2 py-0.5 rounded-md text-[11px] border transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--error-border)'; el.style.color = 'var(--error-text)' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-muted)' }}
                >删除</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── InputPanel ────────────────────────────────────────────────────────────────
function InputPanel({ activeTemplate, agentOverride, customerOverride, serialCountOverride, validUsesOverride,
  preserveOverridesOnTemplateSwitch, onAgentChange, onCustomerChange, onSerialCountChange, onValidUsesChange,
  onPreserveOverridesSwitch, running, error, onGenerate }: {
  activeTemplate: TemplateDefinition
  agentOverride: string; customerOverride: string
  serialCountOverride: string; validUsesOverride: string
  preserveOverridesOnTemplateSwitch: boolean
  onAgentChange: (v: string) => void; onCustomerChange: (v: string) => void
  onSerialCountChange: (v: string) => void; onValidUsesChange: (v: string) => void
  onPreserveOverridesSwitch: (v: boolean) => void
  running: boolean; error: string | null
  onGenerate: () => void
}) {
  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border-input)',
    color: 'var(--text-primary)',
  }
  return (
    <Card className="md:flex-1 lg:w-[300px] lg:flex-none shrink-0 flex flex-col lg:min-h-0">
      <CardHeader tag={{ label: 'BATCH', color: 'green' }} title="批量输入" />
      <div className="lg:flex-1 lg:overflow-auto p-4 flex flex-col gap-4">
        <div className="p-3 rounded-xl border flex flex-col items-center text-center gap-1"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>当前模板</p>
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{activeTemplate.name}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {activeTemplate.genMode === 'serial'
              ? `编号 ${activeTemplate.reagentId} · 序号 ${activeTemplate.serialNumber}~${activeTemplate.serialNumber + activeTemplate.genCount - 1}`
              : `编号列表 · ${activeTemplate.genIdList || '未设置'}`}
          </p>
        </div>

        <CustomerCodeInput
          agentValue={agentOverride} customerValue={customerOverride}
          onAgentChange={onAgentChange} onCustomerChange={onCustomerChange}
          agentLabel="代理商（覆盖）" customerLabel="客户编号（覆盖）"
        />

        {activeTemplate.genMode === 'serial' && (
          <div className="flex flex-col gap-2 p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>序号范围</p>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex flex-col gap-1">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>生成数量</span>
                <input type="number" min={1} max={9999} value={serialCountOverride}
                  onChange={e => onSerialCountChange(e.target.value)}
                  placeholder={String(activeTemplate.genCount)}
                  className="h-9 w-24 px-3 rounded-xl border text-[13px] font-mono outline-none focus:ring-2"
                  style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>有效次（覆盖）</span>
                <input type="number" min={0} max={65535} value={validUsesOverride}
                  onChange={e => onValidUsesChange(e.target.value)}
                  placeholder={String(activeTemplate.validUses)}
                  className="h-9 w-24 px-3 rounded-xl border text-[13px] font-mono outline-none focus:ring-2"
                  style={inputStyle} />
              </label>
              <span className="text-[12px] pt-4" style={{ color: 'var(--text-muted)' }}>
                编号 {activeTemplate.reagentId} · 序号 {activeTemplate.serialNumber}~{activeTemplate.serialNumber + Math.max(0, (parseInt(serialCountOverride || String(activeTemplate.genCount), 10) || activeTemplate.genCount) - 1)}
              </span>
            </div>
          </div>
        )}

        {error && <StatusBar color="indigo"><span style={{ color: 'var(--error-text)' }}>{error}</span></StatusBar>}

        <label className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={preserveOverridesOnTemplateSwitch}
            onChange={(e) => onPreserveOverridesSwitch(e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: 'var(--success)' }}
          />
          切换模板时保留手工覆盖项
        </label>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
          <InfoIcon className="w-3.5 h-3.5 shrink-0" />
          留空则使用模板中的代理商和客户编号
        </div>

        <Button variant="success" size="md" onClick={onGenerate}
          className={`w-full justify-center ${running ? 'opacity-60 pointer-events-none' : ''}`}>
          {running ? <SpinIcon /> : <ZapIcon />} {running ? '生成中…' : '批量生成'}
        </Button>
      </div>
    </Card>
  )
}

// ── ResultPanel ───────────────────────────────────────────────────────────────
function ResultPanel({ records, currentPageRecords, viewMode, printMode, printCols, printPerPage,
  currentPage, totalPages, copyImageState, onViewMode, onPrintMode, onCols, onPerPage, onPage,
  onCopyImage, onExportPng, onExportPdf, onOpenHistory }: {
  records: BatchGeneratedRecord[]
  currentPageRecords: BatchGeneratedRecord[]
  viewMode: ViewMode; printMode: PrintMode
  printCols: number; printPerPage: number
  currentPage: number; totalPages: number
  copyImageState: ReturnType<typeof useCopyAsync>
  onViewMode: (v: ViewMode) => void; onPrintMode: (v: PrintMode) => void
  onCols: (n: number) => void; onPerPage: (n: number) => void
  onPage: (p: number | ((prev: number) => number)) => void
  onCopyImage: () => void; onExportPng: () => void; onExportPdf: () => void
  onOpenHistory: () => void
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { query, setQuery, filtered, total, matchCount } = useResultFilter(records)

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 188,
    overscan: 5,
  })

  const effectiveMode = printMode === 'auto' ? undefined : printMode as 'long' | 'short' | 'both'

  return (
    <Card className="flex-1 flex flex-col lg:min-h-0 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 h-[52px] px-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase shrink-0"
          style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-text)' }}>RESULT</span>
        <span className="text-[15px] font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>批量结果</span>
        {total > 0 && (
          <span className="hidden sm:inline px-2 py-0.5 rounded-full border text-[11px]"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            {query && matchCount !== total ? `${matchCount}/${total}` : `${total} 条`}
          </span>
        )}
        <div className="flex-1" />
        {total > 0 && (
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索…"
              className="h-7 pl-6 pr-3 rounded-lg border text-[12px] outline-none w-28 sm:w-40 focus:w-36 sm:focus:w-52 transition-all"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[11px]"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >✕</button>
            )}
          </div>
        )}
        <button onClick={onOpenHistory}
          className="flex items-center gap-1 h-7 px-2 rounded-lg border text-[11px] transition-colors cursor-pointer shrink-0"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--warning)'; el.style.color = 'var(--warning-text)' }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)' }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="hidden sm:inline">历史</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
        <ToggleGroup
          options={[{ value: 'preview', label: '预览' }, { value: 'print', label: '打印' }]}
          value={viewMode} onChange={onViewMode as (v: string) => void}
          activeStyle={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        />
        <ToggleGroup
          options={[{ value: 'auto', label: '模板' }, { value: 'long', label: '长码' }, { value: 'short', label: '短码' }, { value: 'both', label: '双码' }]}
          value={printMode} onChange={onPrintMode as (v: string) => void}
          activeStyle={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-app)' }}
        />
        <div className="flex items-center gap-1 text-[11px]">
          <span style={{ color: 'var(--text-muted)' }}>列</span>
          <ToggleGroup options={[1,2,3].map(c => ({ value: String(c), label: String(c) }))}
            value={String(printCols)} onChange={v => onCols(Number(v))}
            activeStyle={{ backgroundColor: 'var(--accent)', color: '#fff' }} itemClass="w-7" />
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span style={{ color: 'var(--text-muted)' }}>每页</span>
          <ToggleGroup options={[5,10,20].map(n => ({ value: String(n), label: String(n) }))}
            value={String(printPerPage)} onChange={v => onPerPage(Number(v))}
            activeStyle={{ backgroundColor: 'var(--accent)', color: '#fff' }} />
        </div>
        {records.length > 0 && (
          <div className="flex items-center gap-1 text-[11px]">
            <button onClick={() => onPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
            >‹</button>
            <span className="px-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>{currentPage + 1}/{totalPages}</span>
            <button onClick={() => onPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
            >›</button>
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {copyImageState.copied ? (
            <button
              onClick={onCopyImage}
              className="inline-flex items-center gap-1.5 rounded-full font-medium border px-2.5 py-1 text-[11px] cursor-pointer"
              style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }}
            ><CheckIcon /> 已复制</button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onCopyImage}
              className={`${records.length === 0 ? 'opacity-40 pointer-events-none' : ''} ${copyImageState.copying ? 'opacity-60 pointer-events-none' : ''}`}>
              <CopyImgIcon /> <span className="hidden sm:inline">{copyImageState.copying ? '复制中…' : '复制长图'}</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onExportPng} className={records.length === 0 ? 'opacity-40 pointer-events-none' : ''}><ImageIcon /> <span className="hidden sm:inline">导出长图</span></Button>
          <Button variant="primary" size="sm" onClick={onExportPdf} className={records.length === 0 ? 'opacity-40 pointer-events-none' : ''}><FileTextIcon /> <span className="hidden sm:inline">导出 PDF</span></Button>
        </div>
      </div>

      {/* Content */}
      {records.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-[13px]" style={{ color: 'var(--text-muted)' }}>输入编号列表后点击批量生成</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-[13px]" style={{ color: 'var(--text-muted)' }}>没有匹配 "{query}" 的结果</div>
      ) : viewMode === 'preview' ? (
        <div ref={parentRef} className="lg:flex-1 lg:overflow-auto p-4">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vItem => (
              <div key={vItem.key} data-index={vItem.index}
                ref={virtualizer.measureElement}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vItem.start}px)`, paddingBottom: 12 }}>
                <BatchResultCard record={filtered[vItem.index]} index={vItem.index} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="lg:flex-1 lg:overflow-auto p-4">
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <PrintLayout records={currentPageRecords} globalMode={effectiveMode} cols={printCols} perPage={printPerPage} />
          </div>
        </div>
      )}
    </Card>
  )
}

// ── ToggleGroup ───────────────────────────────────────────────────────────────
function ToggleGroup({ options, value, onChange, activeStyle, itemClass = '' }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  activeStyle: React.CSSProperties
  itemClass?: string
}) {
  return (
    <div className="flex rounded-lg border overflow-hidden text-[11px]" style={{ borderColor: 'var(--border)' }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 cursor-pointer transition-colors ${itemClass}`}
          style={value === o.value ? activeStyle : { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => { if (value !== o.value) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)' }}
          onMouseLeave={e => { if (value !== o.value) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)' }}
        >{o.label}</button>
      ))}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function PlusIcon() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function ZapIcon() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function SpinIcon() { return <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> }
function ImageIcon() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function CopyImgIcon() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h12"/><circle cx="13.5" cy="13.5" r="1.5"/><polyline points="21 18 17 14 11 21"/></svg> }
function CheckIcon() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function FileTextIcon() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function InfoIcon({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> }
