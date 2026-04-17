import { useThemeStore, type Theme } from '../store/themeStore'

const themes: { id: Theme; label: string; icon: string; desc: string }[] = [
  { id: 'light', label: '明亮',  icon: '☀️', desc: '柔和中性白' },
  { id: 'dark',  label: '暗色',  icon: '🌙', desc: '深色专业感' },
  { id: 'glass', label: '玻璃',  icon: '🔮', desc: 'Glassmorphism' },
  { id: 'neon',  label: '霓虹',  icon: '⚡', desc: '电气暗色' },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="flex items-center gap-1">
      {themes.map((t) => (
        <button
          key={t.id}
          title={`${t.label} — ${t.desc}`}
          onClick={() => setTheme(t.id)}
          className={`
            relative h-7 px-2 rounded-md text-xs font-medium transition-all duration-200
            flex items-center gap-1
            ${theme === t.id
              ? 'text-[var(--accent-text)] bg-[var(--accent-light)] ring-1 ring-[var(--accent)]/40'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }
          `}
        >
          <span className="text-sm leading-none">{t.icon}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  )
}
