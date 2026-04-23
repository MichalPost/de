import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { twMerge } from 'tailwind-merge'

interface Props {
  onFiles: (files: File[]) => void
  multiple?: boolean
  scanning?: boolean
  label?: string
}

export function ImageDropZone({ onFiles, multiple = false, scanning = false, label }: Props) {
  const [dragging, setDragging] = useState(false)
  const [pasted, setPasted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | File[] | null) => {
    if (!files) return
    const accepted = Array.from(files).filter(
      f => f.type.startsWith('image/') || f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    )
    if (accepted.length > 0) onFiles(multiple ? accepted : [accepted[0]])
  }, [onFiles, multiple])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (scanning) return
      const items = e.clipboardData?.items
      if (!items) return
      const imgs = Array.from(items)
        .filter(i => i.type.startsWith('image/'))
        .map(i => i.getAsFile())
        .filter(Boolean) as File[]
      if (imgs.length === 0) return
      e.preventDefault()
      handleFiles(imgs)
      setPasted(true)
      setTimeout(() => setPasted(false), 1500)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFiles, scanning])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !scanning && inputRef.current?.click()}
      className={twMerge(
        'relative flex cursor-pointer select-none flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5',
        'transition-[background-color,border-color,color,box-shadow,opacity] duration-200',
        scanning && 'pointer-events-none opacity-70',
        dragging
          ? 'border-ct-brand bg-ct-brand-soft'
          : pasted
            ? 'border-ct-success bg-ct-success-soft'
            : 'border-ct-border bg-ct-surface-input hover:border-ct-brand',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,.pdf"
        multiple={multiple}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      <AnimatePresence mode="wait">
        {scanning ? (
          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2">
            <svg className="h-7 w-7 animate-spin text-ct-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span className="text-[12px] font-medium text-ct-brand-foreground">识别中…</span>
          </motion.div>
        ) : pasted ? (
          <motion.div key="pasted" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2">
            <svg className="h-7 w-7 text-ct-success-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="text-[12px] font-medium text-ct-success-foreground">已粘贴图片</span>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2">
            <svg className="h-7 w-7 text-ct-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
              <circle cx="16" cy="16" r="2.5"/>
              <path d="m21 21-1.5-1.5"/>
            </svg>
            <span className="text-center text-[12px] leading-relaxed text-ct-content-muted">
              {label ?? (multiple ? '拖入多张图片 / 点击选择' : '拖入图片 / 点击选择')}
            </span>
            <span className="text-[10px] text-ct-content-faint">支持拖拽、点击选择、Ctrl+V 粘贴</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
