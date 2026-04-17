import { useRef } from 'react'
import { useTemplateStore } from '../store/templateStore'
import { useToast } from '../ui/Toast'
import { DownloadIcon, UploadIcon } from '../ui/icons'
import type { TemplateDefinition } from '../features/batch/types'
import { usePlatformOps } from '../lib/platformOps'
import {
  DEFAULT_PDF_BARCODE_SCALE,
  MAX_PDF_BARCODE_SCALE,
  MIN_PDF_BARCODE_SCALE,
  usePdfSettingsStore,
} from '../store/pdfSettingsStore'

export function SettingsPage() {
  const { templates, addTemplate } = useTemplateStore()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const platform = usePlatformOps()
  const pdfBarcodeScale = usePdfSettingsStore((s) => s.pdfBarcodeScale)
  const setPdfBarcodeScale = usePdfSettingsStore((s) => s.setPdfBarcodeScale)

  const handleExport = async () => {
    try {
      await platform.exportJsonFile(templates, `reagent-templates-${new Date().toISOString().slice(0, 10)}.json`)
      showToast(`已导出 ${templates.length} 个模板`)
    } catch {
      showToast('导出失败')
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        const arr: TemplateDefinition[] = Array.isArray(parsed) ? parsed : parsed?.state?.templates
        if (!Array.isArray(arr) || arr.length === 0) throw new Error('文件格式不正确')
        let count = 0
        for (const t of arr) {
          if (t.id && t.name) {
            addTemplate({ ...t, id: crypto.randomUUID(), updatedAt: Date.now() })
            count++
          }
        }
        showToast(`已导入 ${count} 个模板`)
      } catch (err) {
        showToast(`导入失败：${(err as Error).message}`)
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border)',
    boxShadow: 'var(--shadow-sm)',
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto flex flex-col gap-6">
      <section className="rounded-2xl border p-5 flex flex-col gap-4" style={cardStyle}>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>PDF 条码占比</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            调整导出 PDF 时条码在 A4 页面的占比。当前为 {pdfBarcodeScale}%。
          </p>
        </div>

        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={MIN_PDF_BARCODE_SCALE}
              max={MAX_PDF_BARCODE_SCALE}
              step={1}
              value={pdfBarcodeScale}
              onChange={(e) => setPdfBarcodeScale(Number(e.target.value))}
              className="flex-1"
            />
            <div
              className="min-w-[64px] h-9 rounded-xl border flex items-center justify-center text-[13px] font-medium"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
            >
              {pdfBarcodeScale}%
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPdfBarcodeScale(DEFAULT_PDF_BARCODE_SCALE)}
              className="h-8 px-3 rounded-lg border text-[12px] cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              恢复默认
            </button>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              建议区间 {DEFAULT_PDF_BARCODE_SCALE - 6}% - {DEFAULT_PDF_BARCODE_SCALE + 8}%。
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-5 flex flex-col gap-4" style={cardStyle}>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>模板备份</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            导出为 JSON 文件保存到本地，换电脑时导入恢复。当前共 {templates.length} 个模板。
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-medium border transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--accent)', color: '#fff', borderColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <DownloadIcon className="w-4 h-4" />
            导出模板
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-medium border transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-input)')}
          >
            <UploadIcon className="w-4 h-4" />
            导入模板
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          导入时会追加到现有模板，不会覆盖。
        </p>
      </section>
    </div>
  )
}
