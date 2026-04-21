import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'glass' | 'neon'

const colorSchemes: Record<Theme, 'light' | 'dark'> = {
  light: 'light',
  dark: 'dark',
  glass: 'light',
  neon: 'dark',
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = colorSchemes[theme]
}

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
    }),
    { name: 'app-theme' }
  )
)

/** Call once on app boot to restore persisted theme */
export function initTheme() {
  const raw = localStorage.getItem('app-theme')
  const theme: Theme = raw ? (JSON.parse(raw)?.state?.theme ?? 'light') : 'light'
  applyTheme(theme)
}
