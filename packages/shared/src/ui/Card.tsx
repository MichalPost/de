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
      className={twMerge('rounded-2xl border', className)}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  )
}

export function CardHeader({ tag, title, actions }: CardHeaderProps) {
  // tag color → CSS var mapping
  const tagStyle: Record<string, React.CSSProperties> = {
    indigo: { backgroundColor: 'var(--accent-light)',   color: 'var(--accent-text)' },
    green:  { backgroundColor: 'var(--success-light)',  color: 'var(--success-text)' },
    amber:  { backgroundColor: 'var(--warning-light)',  color: 'var(--warning-text)' },
    purple: { backgroundColor: 'var(--purple-light)',   color: 'var(--purple-text)' },
  }
  return (
    <div
      className="flex items-center justify-between h-[52px] px-5 border-b shrink-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2.5">
        {tag && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
            style={tagStyle[tag.color]}
          >
            {tag.label}
          </span>
        )}
        <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatusBar({ children, color = 'indigo' }: { children: React.ReactNode; color?: 'indigo' | 'green' | 'purple' }) {
  const styleMap: Record<string, React.CSSProperties> = {
    indigo: { backgroundColor: 'var(--accent-light)',  color: 'var(--accent-text)' },
    green:  { backgroundColor: 'var(--success-light)', color: 'var(--success-text)' },
    purple: { backgroundColor: 'var(--purple-light)',  color: 'var(--purple-text)' },
  }
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px]"
      style={styleMap[color]}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {children}
    </div>
  )
}
