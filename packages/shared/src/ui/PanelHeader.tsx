import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { ToolbarSection, ToolbarSpacer } from './ToolbarLayout'

interface PanelHeaderProps {
  tag?: { label: string; color: 'indigo' | 'green' | 'amber' | 'purple' }
  title: string
  meta?: ReactNode
  actions?: ReactNode
  className?: string
  bordered?: boolean
}

export function PanelHeader({
  tag,
  title,
  meta,
  actions,
  className,
  bordered = true,
}: PanelHeaderProps) {
  const tagClassName: Record<NonNullable<PanelHeaderProps['tag']>['color'], string> = {
    indigo: 'bg-ct-brand-soft text-ct-brand-foreground',
    green: 'bg-ct-success-soft text-ct-success-foreground',
    amber: 'bg-ct-warning-soft text-ct-warning-foreground',
    purple: 'bg-ct-highlight-soft text-ct-highlight-foreground',
  }

  return (
    <div
      className={twMerge(
        'flex min-h-[52px] items-center gap-2 px-4 sm:px-5',
        bordered && 'border-b border-ct-border',
        className,
      )}
    >
      <ToolbarSection className="gap-2 shrink-0">
        {tag && (
          <span
            className={twMerge(
              'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase',
              tagClassName[tag.color],
            )}
          >
            {tag.label}
          </span>
        )}
        <span className="text-[15px] font-semibold text-ct-content-primary">{title}</span>
        {meta}
      </ToolbarSection>
      <ToolbarSpacer />
      {actions ? <ToolbarSection className="shrink-0">{actions}</ToolbarSection> : null}
    </div>
  )
}
