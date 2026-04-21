import { AnimatePresence, motion } from 'motion/react'
import { Button } from './Button'

interface UpdateDialogProps {
  version: string
  onInstall: () => void
  onDismiss: () => void
  installing?: boolean
}

export function UpdateDialog({ version, onInstall, onDismiss, installing = false }: UpdateDialogProps) {
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
        onClick={installing ? undefined : onDismiss}
      >
        {/* Dialog card */}
        <motion.div
          key="dialog"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-ct-border bg-ct-surface-card p-6 shadow-[var(--shadow-card)]"
          onClick={e => e.stopPropagation()}
        >
          {/* Icon + title */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ct-brand-soft text-ct-brand">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-[15px] font-semibold text-ct-content-primary">
                发现新版本
              </p>
              <p className="text-[12px] text-ct-content-muted">
                版本 <span className="font-mono text-ct-brand-foreground">{version}</span> 已可用，建议立即更新
              </p>
            </div>
          </div>

          {/* Progress hint when installing */}
          {installing && (
            <div className="flex items-center gap-2 rounded-xl bg-ct-brand-soft px-3 py-2.5 text-[12px] text-ct-brand-foreground">
              <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              正在下载并安装，完成后自动重启…
            </div>
          )}

          {/* Actions */}
          {!installing && (
            <div className="flex gap-2">
              <Button
                onClick={onDismiss}
                variant="default"
                fullWidth
              >
                稍后再说
              </Button>
              <Button
                onClick={onInstall}
                variant="primary"
                fullWidth
              >
                立即更新
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
