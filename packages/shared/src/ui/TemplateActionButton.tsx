import type { ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { Button } from './Button'

interface TemplateActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string
  danger?: boolean
}

export function TemplateActionButton({
  label,
  danger = false,
  className,
  ...props
}: TemplateActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={twMerge(
        'min-h-0 rounded-md bg-ct-surface-card px-2 py-0.5 text-[11px]',
        danger
          ? 'text-ct-content-muted hover:border-ct-danger-border hover:text-ct-danger-foreground'
          : 'text-ct-content-secondary hover:border-ct-brand hover:text-ct-brand-foreground',
        className,
      )}
      {...props}
    >
      {label}
    </Button>
  )
}
