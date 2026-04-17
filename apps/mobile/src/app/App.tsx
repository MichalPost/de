import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@chemtools/shared/ui/AppShell'
import { CryptoPage } from '../pages/CryptoPage'
import { DecodePage } from '../pages/DecodePage'
import { EncodePage } from '../pages/EncodePage'
import { HomePage } from '../pages/HomePage'
import { BatchPage } from '../pages/BatchPage'
import { ScanBatchPage } from '../pages/ScanBatchPage'
import { SettingsPage } from '../pages/SettingsPage'
import { ToastProvider } from '@chemtools/shared/ui/Toast'

export function App() {
  return (
    <ToastProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/encode" element={<EncodePage />} />
          <Route path="/decode" element={<DecodePage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/batch" element={<BatchPage />} />
          <Route path="/scan" element={<ScanBatchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </ToastProvider>
  )
}
