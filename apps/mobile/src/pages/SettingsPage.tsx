import { useEffect, useState } from 'react'
import { Browser } from '@capacitor/browser'
import { SettingsPage as SharedSettingsPage } from '@chemtools/shared/pages/SettingsPage'
import { checkAndroidUpdate } from '../lib/updater'

export function SettingsPage() {
  const [updateInfo, setUpdateInfo] = useState<{ version: string; downloadUrl: string } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAndroidUpdate()
      .then(({ available, version, downloadUrl }) => {
        if (available && version && downloadUrl) setUpdateInfo({ version, downloadUrl })
      })
      .finally(() => setChecking(false))
  }, [])

  const handleDownload = () => {
    if (updateInfo) Browser.open({ url: updateInfo.downloadUrl })
  }

  return (
    <>
      {/* Update banner — shown above the shared settings content */}
      {!checking && updateInfo && (
        <div
          className="mx-4 mt-4 rounded-2xl border p-4 flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--accent-light)',
            borderColor: 'var(--accent-border)',
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-text)' }}>
              发现新版本 {updateInfo.version}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              点击下载安装包，安装后重启即可
            </span>
          </div>
          <button
            onClick={handleDownload}
            className="shrink-0 h-8 px-4 rounded-xl text-[12px] font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            下载更新
          </button>
        </div>
      )}

      <SharedSettingsPage />
    </>
  )
}
