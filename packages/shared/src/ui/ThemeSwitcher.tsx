import { useState, useRef, useEffect } from 'react'
import { useThemeStore, type Theme } from '../store/themeStore'

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
    <div ref={ref} className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          color: 'var(--text-secondary)',
          backgroundColor: open ? 'var(--bg-hover)' : 'transparent',
          border: '1px solid var(--border)',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
      >
        <span className="text-sm leading-none">{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 下拉列表 */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors"
              style={{
                backgroundColor: theme === t.id ? 'var(--accent-light)' : 'transparent',
                color: theme === t.id ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (theme !== t.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (theme !== t.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              <span className="text-base leading-none w-5 text-center">{t.icon}</span>
              <div className="flex flex-col">
                <span className="font-medium leading-tight">{t.label}</span>
                <span className="text-[11px] opacity-60 leading-tight">{t.desc}</span>
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
