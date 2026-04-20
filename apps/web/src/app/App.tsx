import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@chemtools/shared/ui/AppShell'
import { ToastProvider, useToast } from '@chemtools/shared/ui/Toast'
import { PlatformOpsContext } from '@chemtools/shared/lib/platformOps'
import { webPlatformOps } from '../lib/platformOps'
import { tauriPlatformOps } from '../lib/tauriPlatformOps'
import { ErrorBoundary } from '@chemtools/shared/ui/ErrorBoundary'
import { checkForUpdate } from '../lib/updater'

// Tauri injects a global __TAURI_INTERNALS__ object into the WebView
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
const platformOps = isTauri ? tauriPlatformOps : webPlatformOps

const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })))
const EncodePage = lazy(() => import('../pages/EncodePage').then(m => ({ default: m.EncodePage })))
const DecodePage = lazy(() => import('../pages/DecodePage').then(m => ({ default: m.DecodePage })))
const CryptoPage = lazy(() => import('../pages/CryptoPage').then(m => ({ default: m.CryptoPage })))
const BatchPage = lazy(() => import('../pages/BatchPage').then(m => ({ default: m.BatchPage })))
const ScanBatchPage = lazy(() => import('../pages/ScanBatchPage').then(m => ({ default: m.ScanBatchPage })))
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const BitShiftPage = lazy(() => import('../pages/BitShiftPage').then(m => ({ default: m.BitShiftPage })))
const DigitCryptoPage = lazy(() => import('../pages/DigitCryptoPage').then(m => ({ default: m.DigitCryptoPage })))

// Separated so it can access useToast inside ToastProvider
function UpdateChecker() {
  const { showToast } = useToast()

  useEffect(() => {
    // Only runs inside Tauri — plugin-updater throws outside of it
    if (!('__TAURI_INTERNALS__' in window)) return
    checkForUpdate().then(({ available, version, install }) => {
      if (!available || !install) return
      showToast(`发现新版本 ${version}，正在下载…`)
      install().catch(() => showToast('更新失败，请稍后重试'))
    })
  }, [showToast])

  return null
}

export function App() {
  return (
    <PlatformOpsContext.Provider value={platformOps}>
      <ErrorBoundary>
        <ToastProvider>
          <UpdateChecker />
          <AppShell>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/encode" element={<EncodePage />} />
                <Route path="/decode" element={<DecodePage />} />
                <Route path="/crypto" element={<CryptoPage />} />
                <Route path="/batch" element={<BatchPage />} />
                <Route path="/scan" element={<ScanBatchPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/bit-shift" element={<BitShiftPage />} />
                <Route path="/digit-crypto" element={<DigitCryptoPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </ToastProvider>
      </ErrorBoundary>
    </PlatformOpsContext.Provider>
  )
}
