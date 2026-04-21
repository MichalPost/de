import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CodeIcon, ScanIcon, LockIcon, LayersIcon, ChevronRightIcon, MenuIcon, CameraIcon, SettingsIcon, BinaryIcon, ShieldCheckIcon } from './icons'
import { ThemeSwitcher } from './ThemeSwitcher'
import { GlassSurface } from './GlassSurface'
import { twMerge } from 'tailwind-merge'

const navItems = [
  { to: '/encode',       label: '试剂包生成',   icon: CodeIcon },
  { to: '/decode',       label: '长码解包',     icon: ScanIcon },
  { to: '/scan',         label: '图片识别',     icon: CameraIcon },
  { to: '/crypto',       label: '3DES 加密',    icon: LockIcon },
  { to: '/batch',        label: '批量生成器',   icon: LayersIcon },
  { to: '/bit-shift',    label: '进制位移',     icon: BinaryIcon },
  { to: '/digit-crypto', label: '数字加密解密', icon: ShieldCheckIcon },
]

const breadcrumbMap: Record<string, string> = {
  '/encode':       '试剂包生成',
  '/decode':       '长码解包',
  '/scan':         '图片识别',
  '/crypto':       '3DES 加密',
  '/batch':        '批量生成器',
  '/bit-shift':    '进制位移计算器',
  '/digit-crypto': '数字加密解密器',
  '/settings':     '设置',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const pageTitle = breadcrumbMap[pathname] ?? '首页'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navClassName = ({ isActive }: { isActive: boolean }) => twMerge(
    'flex items-center gap-2.5 rounded-lg py-2 pl-5 pr-2.5 text-[13px] transition-[background-color,color,box-shadow] duration-150',
    isActive ? 'nav-active bg-ct-brand-soft font-medium text-ct-brand-foreground' : 'text-ct-content-secondary hover:bg-ct-surface-hover',
  )

  const footerNavClassName = ({ isActive }: { isActive: boolean }) => twMerge(
    'flex items-center gap-2.5 rounded-lg py-2 pl-5 pr-2.5 text-[13px] transition-[background-color,color,box-shadow] duration-150',
    isActive ? 'nav-active bg-ct-brand-soft font-medium text-ct-brand-foreground' : 'text-ct-content-muted hover:bg-ct-surface-hover',
  )

  return (
    <div className="flex h-screen overflow-hidden bg-ct-surface-app">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <GlassSurface
        as="aside"
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-[220px] shrink-0 flex flex-col
          border-r border-ct-border transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="absolute inset-0 -z-10 bg-ct-surface-sidebar" />
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-ct-border px-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ct-brand">
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <span className="text-sm font-semibold text-ct-content-primary">试剂包</span>
          <span className="text-sm text-ct-content-muted">工作台</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5">
          <p className="px-5 py-1 text-[10px] font-semibold tracking-widest uppercase text-ct-content-muted">
            工具
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={navClassName}
            >
              {() => (
                <>
                  <Icon className="w-4 h-4 shrink-0 opacity-70" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-ct-border py-3">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={footerNavClassName}
          >
            {() => (
              <>
                <SettingsIcon className="w-4 h-4 shrink-0 opacity-70" />
                设置
              </>
            )}
          </NavLink>
        </div>
      </GlassSurface>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <GlassSurface as="header" className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-ct-border bg-ct-surface-header px-4 md:px-7">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              className="rounded-lg p-2 text-ct-content-muted transition-colors hover:bg-ct-surface-hover md:hidden"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="菜单"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="hidden text-ct-content-muted sm:inline">工具</span>
              <ChevronRightIcon className="hidden sm:block w-3.5 h-3.5" />
              <span className="font-medium text-ct-content-primary">{pageTitle}</span>
            </div>
          </div>

          {/* Theme switcher */}
          <ThemeSwitcher />
        </GlassSurface>

        {/* Page content */}
        <main className="relative z-0 flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
