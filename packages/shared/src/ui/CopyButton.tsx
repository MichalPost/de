import { useState, useCallback } from 'react'
import { useToast } from './Toast'

export function useCopy() {
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true)
        showToast('复制成功')
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => showToast('复制失败', 'error'))
  }, [showToast])
  return { copied, copy }
}

export function useCopyAsync() {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()
  const copy = useCallback(async (fn: () => Promise<void>) => {
    if (copying) return
    setCopying(true)
    try {
      await fn()
      setCopied(true)
      showToast('复制成功')
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      showToast('复制失败', 'error')
      throw error
    } finally {
      setCopying(false)
    }
  }, [copying, showToast])
  return { copying, copied, copy }
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const { copied, copy } = useCopy()
  if (!value) return null

  const baseStyle: React.CSSProperties = copied
    ? { backgroundColor: 'var(--success-light)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }
    : { backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', borderColor: 'var(--border)' }

  return (
    <button
      onClick={() => copy(value)}
      title="复制"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer border ${className ?? ''}`}
      style={baseStyle}
      onMouseEnter={e => { if (!copied) {
        const el = e.currentTarget
        el.style.color = 'var(--accent-text)'
        el.style.borderColor = 'var(--accent)'
        el.style.backgroundColor = 'var(--accent-light)'
      }}}
      onMouseLeave={e => { if (!copied) {
        const el = e.currentTarget
        el.style.color = 'var(--text-muted)'
        el.style.borderColor = 'var(--border)'
        el.style.backgroundColor = 'var(--bg-input)'
      }}}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

import { CopyIcon, CheckIcon } from './icons'
