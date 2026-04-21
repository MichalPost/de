import { twMerge } from 'tailwind-merge'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { CopyButton } from './CopyButton'
export { Button } from './Button'

interface InputFieldProps {
  label?: string
  id: string
  value: string | number
  onChange: (v: string) => void
  type?: 'number' | 'text'
  min?: number
  max?: number
  mono?: boolean
  readOnly?: boolean
  rows?: number
  onKeyDown?: (e: KeyboardEvent<any>) => void
  onPaste?: (e: ClipboardEvent<any>) => void
  placeholder?: string
  className?: string
}

const inputBase = [
  'w-full rounded-xl border bg-ct-surface-input text-ct-content-primary',
  'transition-[background-color,border-color,color,box-shadow] duration-200',
  'outline-hidden',
  'border-ct-border-input placeholder:text-ct-content-faint',
  'focus:border-ct-brand focus:ring-4 focus:ring-ct-brand/15',
  'read-only:text-ct-content-secondary read-only:cursor-default',
  'disabled:opacity-60 disabled:cursor-not-allowed',
].join(' ')

const labelClassName = 'text-[11px] font-medium text-ct-content-muted'

export function InputField({
  label,
  id,
  value,
  onChange,
  type = 'number',
  min,
  max,
  mono,
  readOnly,
  placeholder,
  className,
  onKeyDown,
  onPaste,
}: InputFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className={labelClassName}>{label}</span> : null}
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className={twMerge(
          'h-11 px-3 text-[13px]',
          inputBase,
          mono && 'font-mono',
          className,
        )}
      />
    </label>
  )
}

export function NumberField(props: Omit<InputFieldProps, 'type'>) {
  return <InputField {...props} type="number" />
}

export function TextareaField({
  label,
  id,
  value,
  onChange,
  mono,
  readOnly,
  rows = 2,
  onKeyDown,
  onPaste,
  placeholder,
  className,
}: InputFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className={labelClassName}>{label}</span> : null}
      <textarea
        id={id}
        value={value}
        readOnly={readOnly}
        rows={rows}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className={twMerge(
          'min-h-24 px-3 py-2.5 text-[12px] resize-none leading-relaxed',
          inputBase,
          mono && 'font-mono',
          className,
        )}
      />
    </label>
  )
}

export function OutputField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={labelClassName}>{label}</span>
        <CopyButton value={value} />
      </div>
      <div
        className={twMerge(
          'min-h-11 px-3 flex items-center rounded-xl border text-[11px] overflow-hidden',
          'border-ct-border bg-ct-surface-input text-ct-content-secondary',
          mono && 'font-mono',
        )}
      >
        <span className="truncate">{value || '—'}</span>
      </div>
    </div>
  )
}
