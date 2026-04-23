import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { twMerge } from 'tailwind-merge'
import { Card, CardHeader, StatusBar } from '../ui/Card'
import { Button } from '../ui/Button'
import { NumberField } from '../ui/Field'
import { PanelHeader } from '../ui/PanelHeader'
import { TemplateActionButton } from '../ui/TemplateActionButton'
import { ToolbarActionButton } from '../ui/ToolbarActionButton'
import { ToolbarIconButton } from '../ui/ToolbarIconButton'
import { ToolbarSection, ToolbarSpacer } from '../ui/ToolbarLayout'
import { ToolbarPageStepper } from '../ui/ToolbarPageStepper'
import { ToolbarSearchField } from '../ui/ToolbarSearchField'
import { CustomerCodeInput } from '../ui/CustomerCodeInput'
import { createTemplate, getDefaultTemplateDefinition } from '../features/batch/templateStore'
import { buildBatchCodes, parseReagentIds } from '../features/batch/batchEngine'
import { TemplateModal } from '../features/batch/TemplateModal'
import { BatchResultCard } from '../features/batch/BatchResultCard'
import { BatchHistoryPanel } from '../features/batch/BatchHistoryPanel'
import { PrintLayout } from '../features/batch/PrintLayout'
import { useResultFilter } from '../features/batch/useResultFilter'
import { useCopyAsync } from '../ui/CopyButton'
import { SegmentedControl } from '../ui/SegmentedControl'
import { useToast } from '../ui/Toast'
import { useTemplateStore } from '../store/templateStore'
import { useBatchDataStore } from '../store/batchDataStore'
import { useBatchUIStore } from '../store/batchUIStore'
import { useHistoryStore } from '../store/historyStore'
import { usePlatformOps } from '../lib/platformOps'
import { usePdfSettingsStore } from '../store/pdfSettingsStore'
import type { BatchHistoryEntry, TemplateDefinition } from '../features/batch/types'
import type { BatchGeneratedRecord } from '../features/batch/types'
import type { BatchWorkerApi } from '../features/batch/useBatchWorker'
import type { Remote } from 'comlink'

type PrintMode = 'long' | 'short' | 'both' | 'auto'
type ViewMode = 'preview' | 'print'

interface BatchPageProps {
  /** Optional Comlink-wrapped worker. When provided, batch generation runs off the main thread. */
  worker?: Remote<BatchWorkerApi>
}

interface ResultToolbarProps {
  records: BatchGeneratedRecord[]
  viewMode: ViewMode
  printMode: PrintMode
  printCols: number
  printPerPage: number
  currentPage: number
  totalPages: number
  copyImageState: ReturnType<typeof useCopyAsync>
  onViewMode: (v: ViewMode) => void
  onPrintMode: (v: PrintMode) => void
  onCols: (n: number) => void
  onPerPage: (n: number) => void
  onPage: (p: number | ((prev: number) => number)) => void
  onCopyImage: () => void
  onExportPng: () => void
  onExportPdf: () => void
  onCopyLongText: () => void
  onCopyShortText: () => void
  onCopyBothText: () => void
  copyLongTextState: { copied: boolean }
  copyShortTextState: { copied: boolean }
  copyBothTextState: { copied: boolean }
}

interface ResultHeaderProps {
  total: number
  matchCount: number
  query: string
  onQueryChange: (value: string) => void
  onClearQuery: () => void
  onOpenHistory: () => void
}

export function BatchPage({ worker }: BatchPageProps = {}) {
  const { templates, activeId, setActiveId, addTemplate, updateTemplate, deleteTemplate } = useTemplateStore()
  const records = useBatchDataStore(s => s.records)
  const error = useBatchDataStore(s => s.error)
  const running = useBatchDataStore(s => s.running)
  const agentOverride = useBatchDataStore(s => s.agentOverride)
  const customerOverride = useBatchDataStore(s => s.customerOverride)
  const serialCountOverride = useBatchDataStore(s => s.serialCountOverride)
  const validUsesOverride = useBatchDataStore(s => s.validUsesOverride)
  const preserveOverridesOnTemplateSwitch = useBatchDataStore(s => s.preserveOverridesOnTemplateSwitch)
  const setRecords = useBatchDataStore(s => s.setRecords)
  const setError = useBatchDataStore(s => s.setError)
  const setRunning = useBatchDataStore(s => s.setRunning)
  const setAgentOverride = useBatchDataStore(s => s.setAgentOverride)
  const setCustomerOverride = useBatchDataStore(s => s.setCustomerOverride)
  const setSerialCountOverride = useBatchDataStore(s => s.setSerialCountOverride)
  const setValidUsesOverride = useBatchDataStore(s => s.setValidUsesOverride)
  const setPreserveOverridesOnTemplateSwitch = useBatchDataStore(s => s.setPreserveOverridesOnTemplateSwitch)
  const {
    viewMode, printMode, printCols, printPerPage, currentPage,
    setViewMode, setPrintMode, setPrintCols, setPrintPerPage, setCurrentPage,
  } = useBatchUIStore()

  const [editingTemplate, setEditingTemplate] = useState<TemplateDefinition | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const workerDisabledRef = useRef(false)
  const copyImageState = useCopyAsync()
  const { showToast } = useToast()
  const { addEntry } = useHistoryStore()
  const platform = usePlatformOps()
  const pdfBarcodeScale = usePdfSettingsStore((s) => s.pdfBarcodeScale)

  const activeTemplate = templates.find(t => t.id === activeId) ?? templates[0]
  const totalPages = Math.max(1, Math.ceil(records.length / printPerPage))
  const currentPageRecords = records.slice(currentPage * printPerPage, (currentPage + 1) * printPerPage)
  const effectiveMode = printMode === 'auto' ? undefined : printMode as 'long' | 'short' | 'both'

  const runWorkerTask = useCallback(async <T,>(
    task: (workerApi: Remote<BatchWorkerApi>) => Promise<T>,
    fallback: () => T,
  ): Promise<T> => {
    if (!worker || workerDisabledRef.current) return fallback()

    try {
      return await Promise.race([
        task(worker),
        new Promise<T>((_, reject) => {
          window.setTimeout(() => reject(new Error('批量生成后台任务响应超时')), 4000)
        }),
      ])
    } catch {
      workerDisabledRef.current = true
      showToast('后台生成器不可用，已自动切换为当前页面生成。', 'error')
      return fallback()
    }
  }, [worker, showToast])

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

  const handleGenerate = useCallback(async () => {
    setError(null)
    setRunning(true)
    try {
      const overrides = {
        agentIdOverride: agentOverride.trim() ? Number(agentOverride) : undefined,
        customerIdOverride: customerOverride.trim() ? Number(customerOverride) : undefined,
        validUsesOverride: validUsesOverride.trim() ? Number(validUsesOverride) : undefined,
      }
      let result: BatchGeneratedRecord[]
      if (activeTemplate.genMode === 'serial') {
        const count = serialCountOverride.trim() ? parseInt(serialCountOverride, 10) : activeTemplate.genCount
        if (isNaN(count) || count < 1) throw new Error('数量至少为 1')
        const reagentIds = Array.from({ length: count }, () => activeTemplate.reagentId)
        const template = { ...activeTemplate, serialMode: 'increment' as const }
        result = await runWorkerTask(
          workerApi => workerApi.buildBatchCodes(template, { reagentIds, ...overrides }),
          () => buildBatchCodes(template, { reagentIds, ...overrides }),
        )
      } else {
        const reagentIds = await runWorkerTask(
          workerApi => workerApi.parseReagentIds(activeTemplate.genIdList),
          () => parseReagentIds(activeTemplate.genIdList),
        )
        if (reagentIds.length === 0) throw new Error('编号列表为空，请先编辑模板')
        result = await runWorkerTask(
          workerApi => workerApi.buildBatchCodes(activeTemplate, { reagentIds, ...overrides }),
          () => buildBatchCodes(activeTemplate, { reagentIds, ...overrides }),
        )
      }
      setRecords(result)
      addEntry({ templateName: activeTemplate.name, recordCount: result.length, records: result, printMode, printCols, printPerPage })
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }, [agentOverride, customerOverride, serialCountOverride, validUsesOverride, activeTemplate, printMode, printCols, printPerPage, setRecords, setError, setRunning, addEntry, runWorkerTask])

  const handleExportPng = async () => {
    try {
      setError(null)
      const tp = Math.max(1, Math.ceil(records.length / printPerPage))
      if (tp > platform.maxPagesPerPng) showToast(`条码长图将按最多 ${platform.maxPagesPerPng} 页分批导出，避免内存峰值。`)
      await platform.exportBatchAsPng(records, effectiveMode, printCols, printPerPage,
        `批量生成_${activeTemplate.name}_${new Date().toISOString().slice(0, 10)}.png`)
    } catch (e) { setError((e as Error).message) }
  }
  const handleCopyImage = () =>
    copyImageState.copy(() => platform.copyBatchAsImage(records, effectiveMode, printCols, printPerPage))
      .catch(e => setError((e as Error).message))
  const handleExportPdf = async () => {
    try {
      setError(null)
      await platform.exportBatchAsPdf(records, effectiveMode, printCols, printPerPage, activeTemplate.name, pdfBarcodeScale)
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
            className={twMerge(
              'group flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition-[background-color,border-color,color] duration-200',
              t.id === activeId
                ? 'border-ct-brand-border bg-ct-brand-soft'
                : 'border-ct-border bg-ct-surface-input hover:border-ct-brand-border',
            )}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={twMerge('truncate text-[13px] font-medium', t.id === activeId ? 'text-ct-brand-foreground' : 'text-ct-content-primary')}>{t.name}</span>
              <span className="truncate text-[11px] text-ct-content-muted">
                {t.genMode === 'serial' ? `序号范围 · 编号 ${t.reagentId} · ${t.genCount} 条` : `编号列表 · ${t.genIdList || '未设置'}`}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              <TemplateActionButton
                label="编辑"
                onClick={e => { e.stopPropagation(); onEdit(t) }}
              />
              {templates.length > 1 && (
                <TemplateActionButton
                  label="删除"
                  danger
                  onClick={e => { e.stopPropagation(); onDelete(t.id) }}
                />
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
  return (
    <Card className="md:flex-1 lg:w-[300px] lg:flex-none shrink-0 flex flex-col lg:min-h-0">
      <CardHeader tag={{ label: 'BATCH', color: 'green' }} title="批量输入" />
      <div className="lg:flex-1 lg:overflow-auto p-4 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-ct-border bg-ct-surface-input p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ct-content-muted">当前模板</p>
          <p className="text-[13px] font-medium text-ct-content-primary">{activeTemplate.name}</p>
          <p className="text-[11px] text-ct-content-muted">
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
          <div className="flex flex-col gap-2 rounded-xl border border-ct-border bg-ct-surface-input p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ct-content-muted">序号范围</p>
            <div className="flex items-center gap-3 flex-wrap">
              <NumberField
                label="生成数量"
                id="batch-serial-count"
                min={1}
                max={9999}
                value={serialCountOverride}
                onChange={onSerialCountChange}
                placeholder={String(activeTemplate.genCount)}
                className="h-9 w-24 rounded-xl bg-ct-surface-card text-[13px]"
                mono
              />
              <NumberField
                label="有效次（覆盖）"
                id="batch-valid-uses"
                min={0}
                max={65535}
                value={validUsesOverride}
                onChange={onValidUsesChange}
                placeholder={String(activeTemplate.validUses)}
                className="h-9 w-24 rounded-xl bg-ct-surface-card text-[13px]"
                mono
              />
              <span className="pt-4 text-[12px] text-ct-content-muted">
                编号 {activeTemplate.reagentId} · 序号 {activeTemplate.serialNumber}~{activeTemplate.serialNumber + Math.max(0, (parseInt(serialCountOverride || String(activeTemplate.genCount), 10) || activeTemplate.genCount) - 1)}
              </span>
            </div>
          </div>
        )}

        {error && <StatusBar color="indigo"><span className="text-ct-danger-foreground">{error}</span></StatusBar>}

        <label className="flex items-center gap-2 text-[12px] text-ct-content-secondary">
          <input
            type="checkbox"
            checked={preserveOverridesOnTemplateSwitch}
            onChange={(e) => onPreserveOverridesSwitch(e.target.checked)}
            className="h-4 w-4 rounded accent-[var(--success)]"
          />
          切换模板时保留手工覆盖项
        </label>

        <div className="flex items-center gap-2 rounded-xl bg-ct-surface-input px-3 py-2 text-[11px] text-ct-content-muted">
          <InfoIcon className="w-3.5 h-3.5 shrink-0" />
          留空则使用模板中的代理商和客户编号
        </div>

        <ExpiryCalculator storageHalfMonths={activeTemplate.storageHalfMonths} />

        <Button variant="success" size="md" onClick={onGenerate}
          className={`w-full justify-center ${running ? 'opacity-60 pointer-events-none' : ''}`}>
          {running ? <SpinIcon /> : <ZapIcon />} {running ? '生成中…' : '批量生成'}
        </Button>
      </div>
    </Card>
  )
}

// ── ExpiryCalculator ──────────────────────────────────────────────────────────
function ExpiryCalculator({ storageHalfMonths }: { storageHalfMonths: number }) {
  const [mfgDate, setMfgDate] = useState('')

  const result = useMemo(() => {
    if (!mfgDate) return null
    const [y, m, d] = mfgDate.split('-').map(Number)
    if (!y || !m || !d) return null
    const mfg = new Date(y, m - 1, d)
    if (isNaN(mfg.getTime())) return null
    // storageHalfMonths × 15 days = total storage days
    const storageDays = storageHalfMonths * 15
    const expiry = new Date(mfg.getTime() + storageDays * 86400_000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffMs = expiry.getTime() - today.getTime()
    const daysLeft = Math.ceil(diffMs / 86400_000)
    return { expiry, daysLeft }
  }, [mfgDate, storageHalfMonths])

  const expiryStr = result
    ? result.expiry.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : null

  const statusColor = result
    ? result.daysLeft < 0
      ? 'text-ct-danger-foreground'
      : result.daysLeft <= 30
        ? 'text-amber-500'
        : 'text-ct-success-foreground'
    : 'text-ct-content-muted'

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-ct-border bg-ct-surface-input p-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ct-content-muted">有效期计算器</p>
      <div className="flex items-end gap-2 flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ct-content-muted">生产日期</span>
          <input
            type="date"
            value={mfgDate}
            onChange={e => setMfgDate(e.target.value)}
            className="h-9 rounded-xl border border-ct-border-input bg-ct-surface-card px-3 text-[13px] font-mono text-ct-content-primary outline-hidden focus:border-ct-brand focus:ring-4 focus:ring-ct-brand/15 transition-[border-color,box-shadow] duration-200"
          />
        </label>
        <div className="flex flex-col gap-1 pb-0.5">
          <span className="text-[11px] text-ct-content-muted">储存半月数</span>
          <span className="flex h-9 items-center rounded-xl border border-ct-border bg-ct-surface-card px-3 text-[13px] font-mono text-ct-content-secondary">
            {storageHalfMonths} <span className="ml-1 text-[11px] text-ct-content-muted">× 15 天</span>
          </span>
        </div>
      </div>
      {result ? (
        <div className="flex items-center justify-between rounded-lg bg-ct-surface-card px-3 py-2">
          <span className="text-[12px] text-ct-content-secondary">到期日：<span className="font-mono font-medium text-ct-content-primary">{expiryStr}</span></span>
          <span className={`text-[12px] font-semibold ${statusColor}`}>
            {result.daysLeft < 0 ? `已过期 ${Math.abs(result.daysLeft)} 天` : `还剩 ${result.daysLeft} 天`}
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-ct-content-faint">选择生产日期后自动计算</p>
      )}
    </div>
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

  const { showToast } = useToast()
  const [copiedLong, setCopiedLong] = useState(false)
  const [copiedShort, setCopiedShort] = useState(false)
  const [copiedBoth, setCopiedBoth] = useState(false)

  const makeCopyTextHandler = (getText: () => string, setCopied: (v: boolean) => void) => () => {
    const text = getText()
    if (!text) return
    navigator.clipboard.writeText(text)
      .then(() => { setCopied(true); showToast('复制成功'); setTimeout(() => setCopied(false), 1500) })
      .catch(() => showToast('复制失败', 'error'))
  }

  const handleCopyLongText = makeCopyTextHandler(
    () => records.map(r => r.encodedAscii).join('\n'),
    setCopiedLong,
  )
  const handleCopyShortText = makeCopyTextHandler(
    () => records.map(r => r.shortAscii).join('\n'),
    setCopiedShort,
  )
  const handleCopyBothText = makeCopyTextHandler(
    () => records.map(r => `${r.encodedAscii}\n${r.shortAscii}`).join('\n'),
    setCopiedBoth,
  )

  return (
    <Card className="flex-1 flex flex-col lg:min-h-0 min-w-0">
      <ResultHeader
        total={total}
        matchCount={matchCount}
        query={query}
        onQueryChange={setQuery}
        onClearQuery={() => setQuery('')}
        onOpenHistory={onOpenHistory}
      />
      <ResultToolbar
        records={records}
        viewMode={viewMode}
        printMode={printMode}
        printCols={printCols}
        printPerPage={printPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        copyImageState={copyImageState}
        onViewMode={onViewMode}
        onPrintMode={onPrintMode}
        onCols={onCols}
        onPerPage={onPerPage}
        onPage={onPage}
        onCopyImage={onCopyImage}
        onExportPng={onExportPng}
        onExportPdf={onExportPdf}
        onCopyLongText={handleCopyLongText}
        onCopyShortText={handleCopyShortText}
        onCopyBothText={handleCopyBothText}
        copyLongTextState={{ copied: copiedLong }}
        copyShortTextState={{ copied: copiedShort }}
        copyBothTextState={{ copied: copiedBoth }}
      />

      {/* Content */}
      {records.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-ct-content-muted">输入编号列表后点击批量生成</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-ct-content-muted">没有匹配 "{query}" 的结果</div>
      ) : viewMode === 'preview' ? (
        <div ref={parentRef} className="lg:flex-1 lg:overflow-auto p-4">
          <div
            className="relative h-[var(--virtual-total-size)]"
            style={{ '--virtual-total-size': `${virtualizer.getTotalSize()}px` } as CSSProperties}
          >
            {virtualizer.getVirtualItems().map(vItem => (
              <div
                key={vItem.key}
                data-index={vItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full translate-y-[var(--virtual-offset)] pb-3"
                style={{ '--virtual-offset': `${vItem.start}px` } as CSSProperties}
              >
                <BatchResultCard record={filtered[vItem.index]} index={vItem.index} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="lg:flex-1 lg:overflow-auto p-4">
          <div className="overflow-hidden rounded-xl border border-ct-border">
            <PrintLayout records={currentPageRecords} globalMode={effectiveMode} cols={printCols} perPage={printPerPage} />
          </div>
        </div>
      )}
    </Card>
  )
}

function ResultHeader({
  total,
  matchCount,
  query,
  onQueryChange,
  onClearQuery,
  onOpenHistory,
}: ResultHeaderProps) {
  return (
    <PanelHeader
      tag={{ label: 'RESULT', color: 'amber' }}
      title="批量结果"
      meta={total > 0 ? (
        <span className="hidden rounded-full border border-ct-border bg-ct-surface-input px-2 py-0.5 text-[11px] text-ct-content-muted sm:inline">
          {query && matchCount !== total ? `${matchCount}/${total}` : `${total} 条`}
        </span>
      ) : undefined}
      actions={
        <>
        {total > 0 && (
          <ToolbarSearchField
            value={query}
            onChange={onQueryChange}
            onClear={onClearQuery}
          />
        )}
        <ToolbarIconButton
          icon={<svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          label="历史"
          accent="warning"
          onClick={onOpenHistory}
        />
        </>
      }
    />
  )
}

function ResultToolbar({
  records,
  viewMode,
  printMode,
  printCols,
  printPerPage,
  currentPage,
  totalPages,
  copyImageState,
  onViewMode,
  onPrintMode,
  onCols,
  onPerPage,
  onPage,
  onCopyImage,
  onExportPng,
  onExportPdf,
  onCopyLongText,
  onCopyShortText,
  onCopyBothText,
  copyLongTextState,
  copyShortTextState,
  copyBothTextState,
}: ResultToolbarProps) {
  const hasRecords = records.length > 0
  const disabledClassName = 'opacity-40 pointer-events-none'
  const busyClassName = 'opacity-60 pointer-events-none'

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-ct-border bg-ct-surface-subtle px-3 py-2">
      <ToolbarSection>
        <SegmentedControl
          options={[{ value: 'preview', label: '预览' }, { value: 'print', label: '打印' }]}
          value={viewMode}
          onChange={onViewMode as (v: string) => void}
          className="min-h-8 rounded-lg p-0.75"
          itemClassName="min-h-7 px-2.5 py-1"
          activeClassName="bg-ct-brand text-white"
          ariaLabel="视图模式"
        />
        <SegmentedControl
          options={[{ value: 'auto', label: '模板' }, { value: 'long', label: '长码' }, { value: 'short', label: '短码' }, { value: 'both', label: '双码' }]}
          value={printMode}
          onChange={onPrintMode as (v: string) => void}
          className="min-h-8 rounded-lg p-0.75"
          itemClassName="min-h-7 px-2.5 py-1"
          activeClassName="bg-ct-content-primary text-ct-surface-app"
          ariaLabel="打印模式"
        />
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-ct-content-muted">列</span>
          <SegmentedControl
            options={[1, 2, 3].map(c => ({ value: String(c), label: String(c) }))}
            value={String(printCols)}
            onChange={v => onCols(Number(v))}
            className="min-h-8 rounded-lg p-0.75"
            itemClassName="min-h-7 w-7 px-0"
            activeClassName="bg-ct-brand text-white"
            ariaLabel="打印列数"
          />
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-ct-content-muted">每页</span>
          <SegmentedControl
            options={[5, 10, 20].map(n => ({ value: String(n), label: String(n) }))}
            value={String(printPerPage)}
            onChange={v => onPerPage(Number(v))}
            className="min-h-8 rounded-lg p-0.75"
            itemClassName="min-h-7 px-2.5 py-1"
            activeClassName="bg-ct-brand text-white"
            ariaLabel="每页数量"
          />
        </div>
        {hasRecords && (
          <ToolbarPageStepper
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => onPage(p => Math.max(0, p - 1))}
            onNext={() => onPage(p => Math.min(totalPages - 1, p + 1))}
          />
        )}
      </ToolbarSection>
      <ToolbarSpacer />
      <ToolbarSection>
        <ToolbarActionButton
          icon={copyLongTextState.copied ? <CheckIcon /> : <CopyTextIcon />}
          label={copyLongTextState.copied ? '已复制' : '复制长码'}
          accent={copyLongTextState.copied ? 'success' : undefined}
          onClick={onCopyLongText}
          className={!hasRecords ? disabledClassName : undefined}
        />
        <ToolbarActionButton
          icon={copyShortTextState.copied ? <CheckIcon /> : <CopyTextIcon />}
          label={copyShortTextState.copied ? '已复制' : '复制短码'}
          accent={copyShortTextState.copied ? 'success' : undefined}
          onClick={onCopyShortText}
          className={!hasRecords ? disabledClassName : undefined}
        />
        <ToolbarActionButton
          icon={copyBothTextState.copied ? <CheckIcon /> : <CopyTextIcon />}
          label={copyBothTextState.copied ? '已复制' : '复制长短码'}
          accent={copyBothTextState.copied ? 'success' : undefined}
          onClick={onCopyBothText}
          className={!hasRecords ? disabledClassName : undefined}
        />
        {copyImageState.copied ? (
          <ToolbarActionButton
            icon={<CheckIcon />}
            label="已复制"
            accent="success"
            onClick={onCopyImage}
            className="rounded-full px-2.5 py-1"
          />
        ) : (
          <ToolbarActionButton
            icon={<CopyImgIcon />}
            label={copyImageState.copying ? '复制中…' : '复制长图'}
            onClick={onCopyImage}
            className={twMerge(!hasRecords && disabledClassName, copyImageState.copying && busyClassName)}
          />
        )}
        <ToolbarActionButton
          icon={<ImageIcon />}
          label="导出长图"
          onClick={onExportPng}
          className={!hasRecords ? disabledClassName : undefined}
        />
        <ToolbarActionButton
          icon={<FileTextIcon />}
          label="导出 PDF"
          accent="primary"
          onClick={onExportPdf}
          className={!hasRecords ? disabledClassName : undefined}
        />
      </ToolbarSection>
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
function CopyTextIcon() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h12"/><line x1="12" y1="13" x2="17" y2="13"/><line x1="12" y1="17" x2="17" y2="17"/></svg> }
