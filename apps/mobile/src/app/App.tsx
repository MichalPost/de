import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@chemtools/shared/ui/AppShell'
import { ToastProvider, useToast } from '@chemtools/shared/ui/Toast'
import { PlatformOpsContext } from '@chemtools/shared/lib/platformOps'
import { mobilePlatformOps } from '../lib/platformOps'
import { ErrorBoundary } from '@chemtools/shared/ui/ErrorBoundary'
import { UpdateDialog } from '@chemtools/shared/ui/UpdateDialog'
import { Browser } from '@capacitor/browser'
import { checkAndroidUpdate } from '../lib/updater'

const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })))
const EncodePage = lazy(() => import('../pages/EncodePage').then(m => ({ default: m.EncodePage })))
const DecodePage = lazy(() => import('../pages/DecodePage').then(m => ({ default: m.DecodePage })))
const CryptoPage = lazy(() => import('../pages/CryptoPage').then(m => ({ default: m.CryptoPage })))
const BatchPage = lazy(() => import('../pages/BatchPage').then(m => ({ default: m.BatchPage })))
const ScanBatchPage = lazy(() => import('../pages/ScanBatchPage').then(m => ({ default: m.ScanBatchPage })))
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const BitShiftPage = lazy(() => import('../pages/BitShiftPage').then(m => ({ default: m.BitShiftPage })))
const DigitCryptoPage = lazy(() => import('../pages/DigitCryptoPage').then(m => ({ default: m.DigitCryptoPage })))

function UpdateChecker() {
  const { showToast } = useToast()
  const [update, setUpdate] = useState<{ version: string; downloadUrl: string } | null>(null)

  useEffect(() => {
    checkAndroidUpdate().then(({ available, version, downloadUrl }) => {
      if (available && version && downloadUrl) {
        setUpdate({ version, downloadUrl })
      }
    })
  }, [])

  const handleInstall = async () => {
    if (!update) return
    try {
      await Browser.open({ url: update.downloadUrl })
      setUpdate(null)
    } catch {
      showToast('打开下载链接失败，请稍后重试', 'error')
    }
  }

  if (!update) return null

  return (
    <UpdateDialog
      version={update.version}
      onInstall={handleInstall}
      onDismiss={() => setUpdate(null)}
    />
  )
}

export function App() {
  return (
    <PlatformOpsContext.Provider value={mobilePlatformOps}>
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
