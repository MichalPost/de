import { motion, AnimatePresence } from 'motion/react'
import { useHistoryStore } from '@chemtools/shared/store/historyStore'
import type { BatchHistoryEntry } from './types'

interface Props {
  open: boolean
  onClose: () => void
  onRestore: (entry: BatchHistoryEntry) => void
}

export function BatchHistoryPanel({ open, onClose, onRestore }: Props) {
  const { entries, removeEntry, clearAll } = useHistoryStore()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[320px] flex flex-col shadow-xl border-l"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between h-14 px-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
                  style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-text)' }}
                >HISTORY</span>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>批次历史</span>
              </div>
              <div className="flex items-center gap-2">
                {entries.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--error-text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >清空</button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.backgroundColor = 'var(--bg-hover)'
                    el.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.backgroundColor = 'transparent'
                    el.style.color = 'var(--text-muted)'
                  }}
                >✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3 flex flex-col gap-2">
              {entries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  暂无历史记录
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <HistoryCard entry={entry} onRestore={onRestore} onDelete={() => removeEntry(entry.id)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function HistoryCard({ entry, onRestore, onDelete }: {
  entry: BatchHistoryEntry
  onRestore: (e: BatchHistoryEntry) => void
  onDelete: () => void
}) {
  const date = new Date(entry.createdAt)
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  return (
    <div
      className="group flex flex-col gap-2 p-3 rounded-xl border transition-colors"
      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--accent-border)'
        el.style.backgroundColor = 'var(--accent-light)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.backgroundColor = 'var(--bg-input)'
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{entry.templateName}</span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{dateStr} · {entry.recordCount} 条</span>
        </div>
        <button
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded transition-all cursor-pointer text-[12px]"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--error-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >✕</button>
      </div>
      <button
        onClick={() => onRestore(entry)}
        className="w-full py-1.5 rounded-lg border text-[12px] font-medium transition-colors cursor-pointer"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--accent-text)' }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.backgroundColor = 'var(--accent-light)'
          el.style.borderColor = 'var(--accent-border)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.backgroundColor = 'var(--bg-card)'
          el.style.borderColor = 'var(--border)'
        }}
      >恢复此批次</button>
    </div>
  )
}
