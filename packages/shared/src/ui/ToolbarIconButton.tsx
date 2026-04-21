import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

interface ToolbarIconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode
  label: string
  accent?: 'default' | 'warning'
  hideLabelOnMobile?: boolean
}

export function ToolbarIconButton({
  icon,
  label,
  accent = 'default',
  hideLabelOnMobile = true,
  className,
  type = 'button',
  ...props
}: ToolbarIconButtonProps) {
  const accentClassName = accent === 'warning'
    ? 'hover:border-ct-warning hover:text-ct-warning-foreground'
    : 'hover:border-ct-brand hover:text-ct-brand-foreground'

  return (
    <button
      type={type}
      className={twMerge(
        'shrink-0 flex h-7 items-center gap-1 rounded-lg border border-ct-border bg-ct-surface-input px-2 text-[11px] text-ct-content-secondary',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        accentClassName,
        className,
      )}
      {...props}
    >
      {icon}
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : undefined}>{label}</span>
    </button>
  )
}
