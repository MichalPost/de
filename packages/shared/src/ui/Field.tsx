import { twMerge } from 'tailwind-merge'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { CopyButton } from './CopyButton'
export { Button } from './Button'

interface InputFieldProps {
  label: string
  id: string
  value: string | number
  onChange: (v: string) => void
  type?: 'number' | 'text'
  min?: number
  max?: number
  mono?: boolean
  readOnly?: boolean
  rows?: number
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  onPaste?: (e: ClipboardEvent<HTMLTextAreaElement>) => void
}

const inputBase = [
  'outline-none transition-colors',
  'bg-[var(--bg-input)] border-[var(--border-input)]',
  'text-[var(--text-primary)]',
  'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10',
].join(' ')

export function InputField({ label, id, value, onChange, type = 'number', min, max, mono, readOnly }: InputFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        max={max}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        className={twMerge(
          'h-9 px-3 rounded-xl border text-[13px]',
          inputBase,
          readOnly && 'cursor-default',
          mono && 'font-mono',
        )}
        style={{ color: readOnly ? 'var(--text-secondary)' : undefined }}
      />
    </label>
  )
}

export function TextareaField({ label, id, value, onChange, mono, readOnly, rows = 2, onKeyDown, onPaste }: InputFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <textarea
        id={id}
        value={value}
        readOnly={readOnly}
        rows={rows}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className={twMerge(
          'px-3 py-2.5 rounded-xl border text-[12px] resize-none leading-relaxed',
          inputBase,
          readOnly && 'cursor-default',
          mono && 'font-mono',
        )}
        style={{ color: readOnly ? 'var(--text-secondary)' : undefined }}
      />
    </label>
  )
}

export function OutputField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <CopyButton value={value} />
      </div>
      <div
        className={twMerge('h-9 px-3 flex items-center rounded-xl border text-[11px] overflow-hidden', mono && 'font-mono')}
        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <span className="truncate">{value || '—'}</span>
      </div>
    </div>
  )
}
