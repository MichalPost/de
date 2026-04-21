import { useState, useRef, useEffect } from 'react'
import { useThemeStore, type Theme } from '../store/themeStore'
import { twMerge } from 'tailwind-merge'

const themes: { id: Theme; label: string; icon: string; desc: string }[] = [
  { id: 'light', label: '明亮', icon: '☀️', desc: '柔和中性白' },
  { id: 'dark',  label: '暗色', icon: '🌙', desc: '深色专业感' },
  { id: 'glass', label: '玻璃', icon: '🔮', desc: 'Glassmorphism' },
  { id: 'neon',  label: '霓虹', icon: '⚡', desc: '电气暗色' },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = themes.find(t => t.id === theme) ?? themes[0]

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={twMerge(
          'flex h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-medium',
          'outline-hidden transition-[background-color,border-color,color,box-shadow] duration-200',
          'border-ct-border bg-transparent text-ct-content-secondary',
          'hover:bg-ct-surface-hover hover:text-ct-content-primary focus-visible:ring-4 focus-visible:ring-ct-brand/15',
          open && 'bg-ct-surface-hover text-ct-content-primary',
        )}
      >
        <span className="text-sm leading-none">{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg
          className={twMerge('h-3 w-3 opacity-50 transition-transform duration-150', open && 'rotate-180')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-2xl border border-ct-border bg-ct-surface-card p-1 shadow-[var(--shadow-md)]"
        >
          {themes.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTheme(t.id); setOpen(false) }}
              className={twMerge(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px]',
                'outline-hidden transition-[background-color,color,box-shadow] duration-200',
                'focus-visible:ring-4 focus-visible:ring-ct-brand/15',
                theme === t.id
                  ? 'bg-ct-brand-soft text-ct-brand-foreground'
                  : 'text-ct-content-secondary hover:bg-ct-surface-hover hover:text-ct-content-primary',
              )}
            >
              <span className="text-base leading-none w-5 text-center">{t.icon}</span>
              <div className="flex flex-col">
                <span className="font-medium leading-tight">{t.label}</span>
                <span className="text-[11px] leading-tight opacity-60">{t.desc}</span>
              </div>
              {theme === t.id && (
                <svg className="w-3.5 h-3.5 ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
