import { twMerge } from 'tailwind-merge'

interface ToolbarSearchFieldProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export function ToolbarSearchField({
  value,
  onChange,
  onClear,
  placeholder = '搜索…',
  className,
  inputClassName,
}: ToolbarSearchFieldProps) {
  return (
    <div className={twMerge('relative', className)}>
      <svg
        className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ct-content-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={twMerge(
          'h-7 w-28 rounded-lg border border-ct-border bg-ct-surface-input pl-6 pr-3 text-[12px] text-ct-content-primary',
          'outline-hidden transition-all focus:w-36 focus:border-ct-brand focus:ring-4 focus:ring-ct-brand/15',
          'sm:w-40 sm:focus:w-52',
          inputClassName,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[11px] text-ct-content-muted transition-colors hover:text-ct-content-primary"
          aria-label="清空搜索"
        >
          ✕
        </button>
      )}
    </div>
  )
}
