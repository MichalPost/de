import { motion, AnimatePresence } from 'motion/react'
import { Button } from '../../ui/Button'
import { useHistoryStore } from '../../store/historyStore'
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
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full flex-col border-l border-ct-border bg-ct-surface-card shadow-[var(--shadow-md)] sm:w-[320px]"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-ct-border px-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-ct-warning-soft px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-ct-warning-foreground">HISTORY</span>
                <span className="text-[14px] font-semibold text-ct-content-primary">批次历史</span>
              </div>
              <div className="flex items-center gap-2">
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="cursor-pointer text-[11px] text-ct-content-muted transition-colors hover:text-ct-danger-foreground"
                  >清空</button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-ct-content-muted transition-colors hover:bg-ct-surface-hover hover:text-ct-content-primary"
                >✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3 flex flex-col gap-2">
              {entries.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[13px] text-ct-content-muted">
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
      className="group flex flex-col gap-2 rounded-xl border border-ct-border bg-ct-surface-input p-3 transition-colors hover:border-ct-brand-border hover:bg-ct-brand-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-[13px] font-medium text-ct-content-primary">{entry.templateName}</span>
          <span className="text-[11px] text-ct-content-muted">{dateStr} · {entry.recordCount} 条</span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[12px] text-ct-content-muted opacity-0 transition-all group-hover:opacity-100 hover:text-ct-danger-foreground"
        >✕</button>
      </div>
      <Button
        onClick={() => onRestore(entry)}
        variant="default"
        size="sm"
        fullWidth
        className="text-ct-brand-foreground hover:text-ct-brand-foreground"
      >恢复此批次</Button>
    </div>
  )
}
