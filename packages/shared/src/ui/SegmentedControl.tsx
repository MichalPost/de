import { twMerge } from 'tailwind-merge'
import type { CSSProperties } from 'react'

export interface SegmentedOption {
  value: string
  label: string
  description?: string
}

interface SegmentedControlProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  itemClassName?: string
  activeClassName?: string
  ariaLabel?: string
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  itemClassName,
  activeClassName = 'bg-ct-brand text-white shadow-[var(--shadow-sm)]',
  ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      className={twMerge(
        'grid min-h-11 items-stretch gap-1 rounded-xl border border-ct-border-input bg-ct-surface-input p-1',
        '[grid-template-columns:repeat(var(--segment-count),minmax(0,1fr))]',
        className,
      )}
      style={{ '--segment-count': options.length } as CSSProperties}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={twMerge(
              'flex h-full min-h-9 items-center justify-center rounded-lg px-2 text-center',
              'text-[12px] leading-[1.15] font-medium break-words',
              'outline-hidden transition-[background-color,color,box-shadow,transform] duration-200',
              'focus-visible:ring-4 focus-visible:ring-ct-brand/15',
              active
                ? activeClassName
                : 'bg-transparent text-ct-content-secondary hover:bg-ct-surface-card hover:text-ct-content-primary',
              itemClassName,
            )}
          >
            <span className="flex flex-col items-center justify-center gap-0.5">
              <span>{option.label}</span>
              {option.description && (
                <span className={twMerge('text-[10px] leading-tight', active ? 'text-white/75' : 'text-ct-content-faint')}>
                  {option.description}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
