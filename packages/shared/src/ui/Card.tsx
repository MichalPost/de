import { twMerge } from 'tailwind-merge'

interface CardProps {
  children: React.ReactNode
  className?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
}

interface CardHeaderProps {
  tag?: { label: string; color: 'indigo' | 'green' | 'amber' | 'purple' }
  title: string
  actions?: React.ReactNode
}

export function Card({ children, className, onKeyDown }: CardProps) {
  return (
    <div
      className={twMerge(
        'rounded-2xl border border-ct-border bg-ct-surface-card shadow-[var(--shadow-card)]',
        className,
      )}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  )
}

export function CardHeader({ tag, title, actions }: CardHeaderProps) {
  const tagClassName: Record<string, string> = {
    indigo: 'bg-ct-brand-soft text-ct-brand-foreground',
    green: 'bg-ct-success-soft text-ct-success-foreground',
    amber: 'bg-ct-warning-soft text-ct-warning-foreground',
    purple: 'bg-ct-highlight-soft text-ct-highlight-foreground',
  }
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-ct-border px-5">
      <div className="flex items-center gap-2.5">
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
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatusBar({ children, color = 'indigo' }: { children: React.ReactNode; color?: 'indigo' | 'green' | 'purple' }) {
  const styleMap: Record<string, string> = {
    indigo: 'bg-ct-brand-soft text-ct-brand-foreground',
    green: 'bg-ct-success-soft text-ct-success-foreground',
    purple: 'bg-ct-highlight-soft text-ct-highlight-foreground',
  }
  return (
    <div
      className={twMerge('flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px]', styleMap[color])}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {children}
    </div>
  )
}
