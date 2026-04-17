import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'glass' | 'neon'

// All CSS variable values per theme
const themeVars: Record<Theme, Record<string, string>> = {
  light: {
    '--bg-app': '#F4F5F7', '--bg-sidebar': '#FFFFFF', '--bg-header': '#FFFFFF',
    '--bg-card': '#FFFFFF', '--bg-input': '#F7F8FA', '--bg-hover': '#F0F1F5',
    '--bg-active': '#EEEEFF', '--bg-subtle': '#FAFAFA',
    '--border': '#E5E7EB', '--border-subtle': '#F0F1F5', '--border-input': '#E5E7EB',
    '--text-primary': '#111827', '--text-secondary': '#4B5563',
    '--text-muted': '#9CA3AF', '--text-faint': '#C4C9D4',
    '--accent': '#635BFF', '--accent-hover': '#4F46E5', '--accent-light': '#EEEEFF',
    '--accent-border': '#C7D2FE', '--accent-text': '#635BFF',
    '--success': '#10B981', '--success-hover': '#059669', '--success-light': '#ECFDF5',
    '--success-border': '#A7F3D0', '--success-text': '#10B981',
    '--warning': '#F59E0B', '--warning-light': '#FFF7ED', '--warning-text': '#F59E0B',
    '--purple': '#A855F7', '--purple-hover': '#9333EA', '--purple-light': '#FDF4FF',
    '--purple-text': '#A855F7',
    '--cyan': '#06B6D4', '--cyan-light': '#ECFEFF', '--cyan-text': '#06B6D4',
    '--error': '#EF4444', '--error-light': '#FEF2F2', '--error-border': '#FECACA',
    '--error-text': '#EF4444',
    '--barcode-text': '#46362b',
    '--shadow-sm': '0 1px 3px rgba(0,0,0,.06)', '--shadow-md': '0 4px 16px rgba(0,0,0,.10)',
    '--shadow-card': '0 1px 3px rgba(0,0,0,.04)',
    '--glass-bg': 'rgba(255,255,255,0.7)', '--glass-border': 'rgba(255,255,255,0.5)',
    '--glass-blur': 'blur(12px)',
  },
  dark: {
    '--bg-app': '#0F1117', '--bg-sidebar': '#161B27', '--bg-header': '#161B27',
    '--bg-card': '#1E2433', '--bg-input': '#252D3D', '--bg-hover': '#252D3D',
    '--bg-active': '#2A2F5A', '--bg-subtle': '#1A2030',
    '--border': '#2A3147', '--border-subtle': '#1E2433', '--border-input': '#2A3147',
    '--text-primary': '#F0F2FF', '--text-secondary': '#A0AABF',
    '--text-muted': '#8892B0', '--text-faint': '#5A6480',
    '--accent': '#7C74FF', '--accent-hover': '#6B63EE', '--accent-light': '#2A2F5A',
    '--accent-border': '#3D3F7A', '--accent-text': '#A89FFF',
    '--success': '#34D399', '--success-hover': '#10B981', '--success-light': '#0D2E22',
    '--success-border': '#1A4A35', '--success-text': '#34D399',
    '--warning': '#FBBF24', '--warning-light': '#2A1F0A', '--warning-text': '#FBBF24',
    '--purple': '#C084FC', '--purple-hover': '#A855F7', '--purple-light': '#2A1040',
    '--purple-text': '#C084FC',
    '--cyan': '#22D3EE', '--cyan-light': '#0A2030', '--cyan-text': '#22D3EE',
    '--error': '#F87171', '--error-light': '#2A0F0F', '--error-border': '#4A1A1A',
    '--error-text': '#F87171',
    '--barcode-text': '#C4A882',
    '--shadow-sm': '0 1px 3px rgba(0,0,0,.4)', '--shadow-md': '0 4px 24px rgba(0,0,0,.5)',
    '--shadow-card': '0 1px 4px rgba(0,0,0,.3)',
    '--glass-bg': 'rgba(22,27,39,0.75)', '--glass-border': 'rgba(255,255,255,0.07)',
    '--glass-blur': 'blur(16px)',
  },
  glass: {
    '--bg-app': '#C9D6FF', '--bg-sidebar': 'rgba(255,255,255,0.55)',
    '--bg-header': 'rgba(255,255,255,0.55)', '--bg-card': 'rgba(255,255,255,0.45)',
    '--bg-input': 'rgba(255,255,255,0.6)', '--bg-hover': 'rgba(255,255,255,0.35)',
    '--bg-active': 'rgba(120,100,255,0.18)', '--bg-subtle': 'rgba(255,255,255,0.3)',
    '--border': 'rgba(255,255,255,0.45)', '--border-subtle': 'rgba(255,255,255,0.25)',
    '--border-input': 'rgba(200,200,255,0.4)',
    '--text-primary': '#1A1A3E', '--text-secondary': '#3D3D6B',
    '--text-muted': '#7B7BAA', '--text-faint': '#ABABCC',
    '--accent': '#635BFF', '--accent-hover': '#4F46E5',
    '--accent-light': 'rgba(99,91,255,0.15)', '--accent-border': 'rgba(99,91,255,0.3)',
    '--accent-text': '#635BFF',
    '--success': '#10B981', '--success-hover': '#059669',
    '--success-light': 'rgba(16,185,129,0.12)', '--success-border': 'rgba(16,185,129,0.3)',
    '--success-text': '#059669',
    '--warning': '#D97706', '--warning-light': 'rgba(245,158,11,0.12)',
    '--warning-text': '#D97706',
    '--purple': '#9333EA', '--purple-hover': '#7C3AED',
    '--purple-light': 'rgba(168,85,247,0.12)', '--purple-text': '#9333EA',
    '--cyan': '#0891B2', '--cyan-light': 'rgba(6,182,212,0.12)', '--cyan-text': '#0891B2',
    '--error': '#DC2626', '--error-light': 'rgba(239,68,68,0.1)',
    '--error-border': 'rgba(239,68,68,0.3)', '--error-text': '#DC2626',
    '--barcode-text': '#3D2B1F',
    '--shadow-sm': '0 2px 8px rgba(99,91,255,.12)', '--shadow-md': '0 8px 32px rgba(99,91,255,.18)',
    '--shadow-card': '0 2px 12px rgba(99,91,255,.1)',
    '--glass-bg': 'rgba(255,255,255,0.45)', '--glass-border': 'rgba(255,255,255,0.55)',
    '--glass-blur': 'blur(20px)',
  },
  neon: {
    '--bg-app': '#07080F', '--bg-sidebar': '#0D0E1A', '--bg-header': '#0D0E1A',
    '--bg-card': '#111220', '--bg-input': '#0D0E1A', '--bg-hover': '#181929',
    '--bg-active': '#1A1040', '--bg-subtle': '#0A0B15',
    '--border': '#1E1F35', '--border-subtle': '#141525', '--border-input': '#252640',
    '--text-primary': '#E8EAFF', '--text-secondary': '#8890C0',
    '--text-muted': '#7080B0', '--text-faint': '#454870',
    '--accent': '#7B5CFF', '--accent-hover': '#6A4AEE', '--accent-light': '#1A1040',
    '--accent-border': '#3A2880', '--accent-text': '#A78BFF',
    '--success': '#39FF14', '--success-hover': '#2ECC10', '--success-light': '#0A1F08',
    '--success-border': '#1A3A10', '--success-text': '#39FF14',
    '--warning': '#FFB800', '--warning-light': '#1F1500', '--warning-text': '#FFB800',
    '--purple': '#D946EF', '--purple-hover': '#C026D3', '--purple-light': '#1A0520',
    '--purple-text': '#E879F9',
    '--cyan': '#00E5FF', '--cyan-light': '#001A20', '--cyan-text': '#00E5FF',
    '--error': '#FF4444', '--error-light': '#1F0808', '--error-border': '#3F1010',
    '--error-text': '#FF6B6B',
    '--barcode-text': '#A89060',
    '--shadow-sm': '0 1px 4px rgba(123,92,255,.2)', '--shadow-md': '0 4px 24px rgba(123,92,255,.35)',
    '--shadow-card': '0 2px 8px rgba(123,92,255,.15)',
    '--glass-bg': 'rgba(13,14,26,0.8)', '--glass-border': 'rgba(123,92,255,0.2)',
    '--glass-blur': 'blur(16px)',
  },
}

/** Apply all CSS variables directly to <html> element */
function applyThemeVars(theme: Theme) {
  const root = document.documentElement
  const vars = themeVars[theme]
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
  root.setAttribute('data-theme', theme)
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
        applyThemeVars(theme)
      },
    }),
    { name: 'app-theme' }
  )
)

/** Call once on app boot to restore persisted theme */
export function initTheme() {
  const raw = localStorage.getItem('app-theme')
  const theme: Theme = raw ? (JSON.parse(raw)?.state?.theme ?? 'light') : 'light'
  applyThemeVars(theme)
}
