import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@chemtools/shared/ui/AppShell'
import { ToastProvider } from '@chemtools/shared/ui/Toast'
import { PlatformOpsContext } from '@chemtools/shared/lib/platformOps'
import { webPlatformOps } from '../lib/platformOps'
import { ErrorBoundary } from '@chemtools/shared/ui/ErrorBoundary'

const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })))
const EncodePage = lazy(() => import('../pages/EncodePage').then(m => ({ default: m.EncodePage })))
const DecodePage = lazy(() => import('../pages/DecodePage').then(m => ({ default: m.DecodePage })))
const CryptoPage = lazy(() => import('../pages/CryptoPage').then(m => ({ default: m.CryptoPage })))
const BatchPage = lazy(() => import('../pages/BatchPage').then(m => ({ default: m.BatchPage })))
const ScanBatchPage = lazy(() => import('../pages/ScanBatchPage').then(m => ({ default: m.ScanBatchPage })))
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const BitShiftPage = lazy(() => import('../../../../packages/shared/src/pages/BitShiftPage').then(m => ({ default: m.BitShiftPage })))
const DigitCryptoPage = lazy(() => import('../pages/DigitCryptoPage').then(m => ({ default: m.DigitCryptoPage })))

export function App() {
  return (
    <PlatformOpsContext.Provider value={webPlatformOps}>
      <ErrorBoundary>
        <ToastProvider>
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
