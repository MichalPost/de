import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

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
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imgs.length > 0) onFiles(multiple ? imgs : [imgs[0]])
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

  const getBorderColor = () => {
    if (dragging) return 'var(--accent)'
    if (pasted) return 'var(--success)'
    return 'var(--border)'
  }
  const getBgColor = () => {
    if (dragging) return 'var(--accent-light)'
    if (pasted) return 'var(--success-light)'
    return 'var(--bg-input)'
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !scanning && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors cursor-pointer select-none p-5 ${scanning ? 'pointer-events-none opacity-70' : ''}`}
      style={{ borderColor: getBorderColor(), backgroundColor: getBgColor() }}
      onMouseEnter={e => { if (!dragging && !pasted && !scanning) (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { if (!dragging && !pasted) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      <AnimatePresence mode="wait">
        {scanning ? (
          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2">
            <svg className="w-7 h-7 animate-spin" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span className="text-[12px] font-medium" style={{ color: 'var(--accent-text)' }}>识别中…</span>
          </motion.div>
        ) : pasted ? (
          <motion.div key="pasted" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2">
            <svg className="w-7 h-7" style={{ color: 'var(--success-text)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="text-[12px] font-medium" style={{ color: 'var(--success-text)' }}>已粘贴图片</span>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2">
            <svg className="w-7 h-7" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
              <circle cx="16" cy="16" r="2.5"/>
              <path d="m21 21-1.5-1.5"/>
            </svg>
            <span className="text-[12px] text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {label ?? (multiple ? '拖入多张图片 / 点击选择' : '拖入图片 / 点击选择')}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>支持拖拽、点击选择、Ctrl+V 粘贴</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
