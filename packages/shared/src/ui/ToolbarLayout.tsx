import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export function ToolbarSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={twMerge('flex flex-wrap items-center gap-1.5', className)}>
      {children}
    </div>
  )
}

export function ToolbarSpacer({ className }: { className?: string }) {
  return <div className={twMerge('flex-1', className)} />
}
