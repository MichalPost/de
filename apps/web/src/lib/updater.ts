import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateResult {
  available: boolean
  version?: string
  install?: () => Promise<void>
  error?: string
}

/**
 * Check for a new desktop version via tauri-plugin-updater.
 * Only runs inside a Tauri window — safe to call unconditionally.
 */
export async function checkForUpdate(): Promise<UpdateResult> {
  try {
    const update = await check()
    if (!update?.available) return { available: false }
    return {
      available: true,
      version: update.version,
      install: async () => {
        await update.downloadAndInstall()
        await relaunch()
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '检查更新失败'
    return { available: false, error: message }
  }
}
