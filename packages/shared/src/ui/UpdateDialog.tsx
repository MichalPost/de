import { AnimatePresence, motion } from 'motion/react'

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
        onClick={installing ? undefined : onDismiss}
      >
        {/* Dialog card */}
        <motion.div
          key="dialog"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-5"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Icon + title */}
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--accent-light)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                发现新版本
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                版本 <span className="font-mono" style={{ color: 'var(--accent-text)' }}>{version}</span> 已可用，建议立即更新
              </p>
            </div>
          </div>

          {/* Progress hint when installing */}
          {installing && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px]"
              style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }}
            >
              <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              正在下载并安装，完成后自动重启…
            </div>
          )}

          {/* Actions */}
          {!installing && (
            <div className="flex gap-2">
              <button
                onClick={onDismiss}
                className="flex-1 h-9 rounded-xl border text-[13px] font-medium cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', borderColor: 'var(--border-input)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-input)')}
              >
                稍后再说
              </button>
              <button
                onClick={onInstall}
                className="flex-1 h-9 rounded-xl text-[13px] font-medium cursor-pointer transition-opacity"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                立即更新
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
