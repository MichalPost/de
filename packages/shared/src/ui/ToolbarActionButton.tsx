import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type ToolbarActionAccent = 'default' | 'primary' | 'success'

interface ToolbarActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon?: ReactNode
  label: string
  accent?: ToolbarActionAccent
  hideLabelOnMobile?: boolean
}

export function ToolbarActionButton({
  icon,
  label,
  accent = 'default',
  hideLabelOnMobile = true,
  className,
  type = 'button',
  ...props
}: ToolbarActionButtonProps) {
  const accentClassName: Record<ToolbarActionAccent, string> = {
    default: 'border-ct-border bg-transparent text-ct-content-secondary hover:border-ct-border-input hover:bg-ct-surface-input hover:text-ct-content-primary',
    primary: 'border-transparent bg-ct-brand text-white shadow-[var(--shadow-sm)] hover:bg-ct-brand-hover',
    success: 'border-ct-success-border bg-ct-success-soft text-ct-success-foreground',
  }

  return (
    <button
      type={type}
      className={twMerge(
        'inline-flex min-h-8 items-center justify-center gap-2 rounded-xl border px-3 text-[11px] font-medium whitespace-nowrap',
        'outline-hidden transition-[background-color,border-color,color,box-shadow] duration-200',
        'focus-visible:border-ct-brand focus-visible:ring-4 focus-visible:ring-ct-brand/15',
        'disabled:cursor-not-allowed disabled:opacity-40',
        accentClassName[accent],
        className,
      )}
      {...props}
    >
      {icon}
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : undefined}>{label}</span>
    </button>
  )
}
