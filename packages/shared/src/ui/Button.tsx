import { twMerge } from 'tailwind-merge'

type Variant = 'primary' | 'default' | 'success' | 'purple' | 'ghost'

const bgVars: Record<Variant, string> = {
  primary: 'var(--accent)',
  success: 'var(--success)',
  purple:  'var(--purple)',
  default: 'var(--bg-input)',
  ghost:   'transparent',
}
const bgHoverVars: Record<Variant, string> = {
  primary: 'var(--accent-hover)',
  success: 'var(--success-hover)',
  purple:  'var(--purple-hover)',
  default: 'var(--bg-card)',
  ghost:   'var(--bg-input)',
}
const colorVars: Record<Variant, string> = {
  primary: '#ffffff',
  success: '#ffffff',
  purple:  '#ffffff',
  default: 'var(--text-secondary)',
  ghost:   'var(--text-secondary)',
}

export function Button({
  children, onClick, variant = 'default', size = 'md', className, style,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: Variant
  size?: 'sm' | 'md'
  className?: string
  style?: React.CSSProperties
}) {
  const base = 'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors cursor-pointer border border-transparent'
  const sizes = { sm: 'px-2.5 py-1 text-[11px]', md: 'px-3.5 py-[7px] text-[12px]' }

  const borderColor = (variant === 'default' || variant === 'ghost') ? 'var(--border)' : 'transparent'

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: bgVars[variant],
        color: colorVars[variant],
        borderColor,
        ...style,
      }}
      className={twMerge(base, sizes[size], className)}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = bgHoverVars[variant]
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = bgVars[variant]
      }}
    >
      {children}
    </button>
  )
}
