import { useState } from 'react'
import { SettingsPage as SharedSettingsPage } from '@chemtools/shared/pages/SettingsPage'
import { checkForUpdate } from '../lib/updater'

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
const IS_TAURI = '__TAURI_INTERNALS__' in window

function DesktopUpdateSection() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'found' | 'up-to-date' | 'installing'>('idle')
  const [newVersion, setNewVersion] = useState<string>()
  const [installFn, setInstallFn] = useState<(() => Promise<void>) | null>(null)

  const handleCheck = async () => {
    setStatus('checking')
    const result = await checkForUpdate()
    if (result.available && result.install) {
      setNewVersion(result.version)
      setInstallFn(() => result.install!)
      setStatus('found')
    } else {
      setStatus('up-to-date')
    }
  }

  const handleInstall = async () => {
    if (!installFn) return
    setStatus('installing')
    await installFn()
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

        {IS_TAURI && (
          <div className="flex items-center gap-2 shrink-0">
            {status === 'found' && (
              <span className="text-[12px]" style={{ color: 'var(--accent-text)' }}>
                发现 {newVersion}
              </span>
            )}
            {status === 'up-to-date' && (
              <span className="text-[12px]" style={{ color: 'var(--success-text)' }}>已是最新</span>
            )}
            <button
              onClick={status === 'found' ? handleInstall : handleCheck}
              disabled={status === 'checking' || status === 'installing'}
              className="h-8 px-4 rounded-xl text-[12px] font-medium border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: status === 'found' ? 'var(--accent)' : 'var(--bg-input)', color: status === 'found' ? '#fff' : 'var(--text-primary)', borderColor: status === 'found' ? 'transparent' : 'var(--border-input)' }}
            >
              {status === 'checking' && '检查中…'}
              {status === 'installing' && '安装中…'}
              {status === 'found' && '立即安装'}
              {(status === 'idle' || status === 'up-to-date') && '检查更新'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export function SettingsPage() {
  return <SharedSettingsPage updateSection={<DesktopUpdateSection />} />
}
