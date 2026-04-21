import { useRef } from 'react'
import type { ReactNode } from 'react'
import { useTemplateStore } from '../store/templateStore'
import { useToast } from '../ui/Toast'
import { DownloadIcon, UploadIcon } from '../ui/icons'
import type { TemplateDefinition } from '../features/batch/types'
import { usePlatformOps } from '../lib/platformOps'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import {
  DEFAULT_PDF_BARCODE_SCALE,
  MAX_PDF_BARCODE_SCALE,
  MIN_PDF_BARCODE_SCALE,
  usePdfSettingsStore,
} from '../store/pdfSettingsStore'

interface SettingsPageProps {
  /** Platform-specific update + version section rendered at the bottom */
  updateSection?: ReactNode
}

export function SettingsPage({ updateSection }: SettingsPageProps = {}) {
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

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-5 shadow-[var(--shadow-sm)]">
        <div>
          <p className="text-[14px] font-semibold text-ct-content-primary">PDF 条码占比</p>
          <p className="mt-1 text-[12px] text-ct-content-muted">
            调整导出 PDF 时条码在 A4 页面的占比。当前为 {pdfBarcodeScale}%。
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-ct-border bg-ct-surface-input p-4">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={MIN_PDF_BARCODE_SCALE}
              max={MAX_PDF_BARCODE_SCALE}
              step={1}
              value={pdfBarcodeScale}
              onChange={(e) => setPdfBarcodeScale(Number(e.target.value))}
              className="flex-1 accent-[var(--brand)]"
            />
            <div className="flex h-10 min-w-[72px] items-center justify-center rounded-xl border border-ct-border-input bg-ct-surface-card text-[13px] font-medium text-ct-content-primary">
              {pdfBarcodeScale}%
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setPdfBarcodeScale(DEFAULT_PDF_BARCODE_SCALE)}
              variant="ghost"
              size="sm"
            >
              恢复默认
            </Button>
            <span className="text-[11px] text-ct-content-muted">
              建议区间 {DEFAULT_PDF_BARCODE_SCALE - 6}% - {DEFAULT_PDF_BARCODE_SCALE + 8}%。
            </span>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5 shadow-[var(--shadow-sm)]">
        <div>
          <p className="text-[14px] font-semibold text-ct-content-primary">模板备份</p>
          <p className="mt-1 text-[12px] text-ct-content-muted">
            导出为 JSON 文件保存到本地，换电脑时导入恢复。当前共 {templates.length} 个模板。
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExport}
            variant="primary"
          >
            <DownloadIcon className="w-4 h-4" />
            导出模板
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="default"
          >
            <UploadIcon className="w-4 h-4" />
            导入模板
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        <p className="text-[11px] text-ct-content-muted">
          导入时会追加到现有模板，不会覆盖。
        </p>
      </Card>

      {updateSection}
    </div>
  )
}
