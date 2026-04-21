import { useState, useCallback } from 'react'
import { twMerge } from 'tailwind-merge'
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

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      title="复制"
      className={twMerge(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]',
        'outline-hidden transition-[background-color,border-color,color,box-shadow] duration-200',
        'focus-visible:ring-4 focus-visible:ring-ct-brand/15',
        copied
          ? 'border-ct-success-border bg-ct-success-soft text-ct-success-foreground'
          : 'border-ct-border bg-ct-surface-input text-ct-content-muted hover:border-ct-brand hover:bg-ct-brand-soft hover:text-ct-brand-foreground',
        className,
      )}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

import { CopyIcon, CheckIcon } from './icons'
