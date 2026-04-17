import { useRef } from 'react'
import { useTemplateStore } from '@chemtools/shared/store/templateStore'
import { useToast } from '@chemtools/shared/ui/Toast'
import { DownloadIcon, UploadIcon } from '@chemtools/shared/ui/icons'
import type { TemplateDefinition } from '../features/batch/types'

export function SettingsPage() {
  const { templates, addTemplate } = useTemplateStore()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = JSON.stringify(templates, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reagent-templates-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`已导出 ${templates.length} 个模板`)
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
