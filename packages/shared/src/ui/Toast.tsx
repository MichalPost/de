import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(1)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = idRef.current++
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 1500)
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg border px-3 py-2 text-[12px] shadow-sm"
            style={
              toast.type === 'error'
                ? { borderColor: 'var(--error-border)', backgroundColor: 'var(--error-light)', color: 'var(--error-text)' }
                : { borderColor: 'var(--success-border)', backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }
            }
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
