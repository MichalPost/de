import type { ElementType, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface GlassSurfaceProps<T extends ElementType = 'div'> {
  as?: T
  children: ReactNode
  className?: string
}

export function GlassSurface<T extends ElementType = 'div'>({
  as,
  children,
  className,
}: GlassSurfaceProps<T>) {
  const Component = as ?? 'div'

  return (
    <Component
      className={twMerge(
        'bg-[var(--glass-bg)] border-[var(--glass-border)]',
        '[backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]',
        className,
      )}
    >
      {children}
    </Component>
  )
}
