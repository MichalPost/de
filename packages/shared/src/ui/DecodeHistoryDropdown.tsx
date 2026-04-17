import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDecodeHistoryStore, type DecodeHistoryEntry } from '../store/decodeHistoryStore'

interface Props {
  onSelect: (raw: string) => void
}

export function DecodeHistoryDropdown({ onSelect }: Props) {
  const { entries, removeEntry, clearAll } = useDecodeHistoryStore()
  const [open, setOpen] = useState(false)

  if (entries.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-input)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--accent-text)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
        }}
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
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-1 z-20 w-[340px] rounded-xl border overflow-hidden shadow-lg"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>最近解码</span>
                <button
                  onClick={() => { clearAll(); setOpen(false) }}
                  className="text-[11px] transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--error-text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
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
      className="group flex items-center gap-2 px-3 py-2 transition-colors"
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <button onClick={onSelect} className="flex-1 min-w-0 text-left cursor-pointer">
        <div className="text-[12px] font-mono truncate" style={{ color: 'var(--text-primary)' }}>{entry.raw}</div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {timeStr} · 编号 {entry.reagentId} · 序号 {entry.serialNumber} · 客户 {entry.customerId}
        </div>
      </button>
      <button
        onClick={onDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded transition-all cursor-pointer text-[11px]"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--error-text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >✕</button>
    </div>
  )
}
