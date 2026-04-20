import { useState } from 'react'
import { Browser } from '@capacitor/browser'
import { SettingsPage as SharedSettingsPage } from '@chemtools/shared/pages/SettingsPage'
import { checkAndroidUpdate } from '../lib/updater'

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

function AndroidUpdateSection() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'found' | 'up-to-date'>('idle')
  const [updateInfo, setUpdateInfo] = useState<{ version: string; downloadUrl: string } | null>(null)

  const handleCheck = async () => {
    setStatus('checking')
    const result = await checkAndroidUpdate()
    if (result.available && result.version && result.downloadUrl) {
      setUpdateInfo({ version: result.version, downloadUrl: result.downloadUrl })
      setStatus('found')
    } else {
      setStatus('up-to-date')
    }
  }

  const handleDownload = () => {
    if (updateInfo) Browser.open({ url: updateInfo.downloadUrl })
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border)',
    boxShadow: 'var(--shadow-sm)',
  }

  return (
    <section className="rounded-2xl border p-5 flex flex-col gap-4" style={cardStyle}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>关于</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            当前版本 <span className="font-mono">{APP_VERSION}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status === 'found' && (
            <span className="text-[12px]" style={{ color: 'var(--accent-text)' }}>
              发现 {updateInfo?.version}
            </span>
          )}
          {status === 'up-to-date' && (
            <span className="text-[12px]" style={{ color: 'var(--success-text)' }}>已是最新</span>
          )}
          <button
            onClick={status === 'found' ? handleDownload : handleCheck}
            disabled={status === 'checking'}
            className="h-8 px-4 rounded-xl text-[12px] font-medium border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: status === 'found' ? 'var(--accent)' : 'var(--bg-input)',
              color: status === 'found' ? '#fff' : 'var(--text-primary)',
              borderColor: status === 'found' ? 'transparent' : 'var(--border-input)',
            }}
          >
            {status === 'checking' && '检查中…'}
            {status === 'found' && '下载更新'}
            {(status === 'idle' || status === 'up-to-date') && '检查更新'}
          </button>
        </div>
      </div>
    </section>
  )
}

export function SettingsPage() {
  return <SharedSettingsPage updateSection={<AndroidUpdateSection />} />
}
