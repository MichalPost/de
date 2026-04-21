import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDecodeHistoryStore, type DecodeHistoryEntry } from '../store/decodeHistoryStore'
import { twMerge } from 'tailwind-merge'

interface Props {
  onSelect: (raw: string) => void
}

export function DecodeHistoryDropdown({ onSelect }: Props) {
  const { entries, removeEntry, clearAll } = useDecodeHistoryStore()
  const [open, setOpen] = useState(false)

  if (entries.length === 0) return null

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-ct-border bg-ct-surface-input px-2.5 py-1 text-[11px] text-ct-content-secondary transition-[background-color,border-color,color] duration-200 hover:border-ct-brand hover:text-ct-brand-foreground"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        最近 {entries.length} 条
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full z-[60] mt-1 w-[340px] overflow-hidden rounded-xl border border-ct-border bg-ct-surface-card shadow-[var(--shadow-md)]"
            >
              <div className="flex items-center justify-between border-b border-ct-border px-3 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-ct-content-muted">最近解码</span>
                <button
                  type="button"
                  onClick={() => { clearAll(); setOpen(false) }}
                  className="text-[11px] text-ct-content-muted transition-colors hover:text-ct-danger-foreground"
                >清空</button>
              </div>
              <div className="max-h-64 overflow-auto">
                {entries.map((e) => (
                  <HistoryRow key={e.id} entry={e}
                    onSelect={() => { onSelect(e.raw); setOpen(false) }}
                    onDelete={() => removeEntry(e.id)}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function HistoryRow({ entry, onSelect, onDelete }: {
  entry: DecodeHistoryEntry
  onSelect: () => void
  onDelete: () => void
}) {
  const date = new Date(entry.createdAt)
  const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 transition-colors hover:bg-ct-surface-hover"
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 cursor-pointer text-left">
        <div className="truncate text-[12px] font-mono text-ct-content-primary">{entry.raw}</div>
        <div className="mt-0.5 text-[10px] text-ct-content-muted">
          {timeStr} · 编号 {entry.reagentId} · 序号 {entry.serialNumber} · 客户 {entry.customerId}
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={twMerge(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] text-ct-content-muted opacity-0 transition-all',
          'group-hover:opacity-100 hover:text-ct-danger-foreground',
        )}
      >✕</button>
    </div>
  )
}
