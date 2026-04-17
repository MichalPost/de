import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CodeIcon, ScanIcon, LockIcon, LayersIcon, ChevronRightIcon, MenuIcon, CameraIcon, SettingsIcon, BinaryIcon, ShieldCheckIcon } from './icons'
import { ThemeSwitcher } from './ThemeSwitcher'

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

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-[220px] shrink-0 flex flex-col
          border-r transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
        }}
      >
        {/* Logo */}
        <div
          className="h-14 flex items-center gap-2 px-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>试剂包</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>工作台</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
          <p
            className="px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            工具
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] transition-all duration-150${isActive ? ' nav-active' : ''}`}
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                fontWeight: isActive ? 500 : 400,
              })}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.classList.contains('nav-active')) el.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.classList.contains('nav-active')) el.style.backgroundColor = 'transparent'
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0 opacity-70" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2.5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] transition-all duration-150${isActive ? ' nav-active' : ''}`}
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
              color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
              fontWeight: isActive ? 500 : 400,
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.classList.contains('nav-active')) el.style.backgroundColor = 'var(--bg-hover)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.classList.contains('nav-active')) el.style.backgroundColor = 'transparent'
            }}
          >
            {() => (
              <>
                <SettingsIcon className="w-4 h-4 shrink-0 opacity-70" />
                设置
              </>
            )}
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-14 shrink-0 flex items-center justify-between px-4 md:px-7 border-b"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderColor: 'var(--border)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="菜单"
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>工具</span>
              <ChevronRightIcon className="hidden sm:block w-3.5 h-3.5" />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{pageTitle}</span>
            </div>
          </div>

          {/* Theme switcher */}
          <ThemeSwitcher />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
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
