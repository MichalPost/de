import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export type ButtonVariant = 'primary' | 'default' | 'success' | 'purple' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
}

const baseClassName = [
  'inline-flex items-center justify-center gap-2 rounded-xl border font-medium whitespace-nowrap',
  'transition-[background-color,border-color,color,box-shadow,transform] duration-200',
  'outline-hidden ring-0',
  'focus-visible:border-ct-brand focus-visible:ring-4 focus-visible:ring-ct-brand/15',
  'disabled:opacity-50 disabled:shadow-none disabled:translate-y-0',
].join(' ')

const variantClassNames: Record<ButtonVariant, string> = {
  primary: [
    'border-transparent text-white',
    'bg-ct-brand hover:bg-ct-brand-hover active:bg-ct-brand-hover',
    'shadow-[var(--shadow-sm)]',
  ].join(' '),
  success: [
    'border-transparent text-white',
    'bg-ct-success hover:bg-ct-success-hover active:bg-ct-success-hover',
    'shadow-[var(--shadow-sm)]',
  ].join(' '),
  purple: [
    'border-transparent text-white',
    'bg-ct-highlight hover:brightness-95 active:brightness-95',
    'shadow-[var(--shadow-sm)]',
  ].join(' '),
  danger: [
    'border-transparent text-white',
    'bg-ct-danger hover:brightness-95 active:brightness-95',
    'shadow-[var(--shadow-sm)]',
  ].join(' '),
  default: [
    'border-ct-border-input bg-ct-surface-input text-ct-content-secondary',
    'hover:border-ct-border hover:bg-ct-surface-hover hover:text-ct-content-primary',
    'active:bg-ct-surface-hover',
  ].join(' '),
  ghost: [
    'border-ct-border bg-transparent text-ct-content-secondary',
    'hover:border-ct-border-input hover:bg-ct-surface-input hover:text-ct-content-primary',
    'active:bg-ct-surface-hover',
  ].join(' '),
}

const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 text-[11px]',
  md: 'min-h-10 px-4 text-[13px]',
  lg: 'min-h-11 px-5 text-[14px]',
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export function Button({
  children,
  variant = 'default',
  size = 'md',
  className,
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={twMerge(
        baseClassName,
        variantClassNames[variant],
        sizeClassNames[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
