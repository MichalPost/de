const MOBILE_UPDATE_MANIFEST_URL = 'https://github.com/MichalPost/de/releases/latest/download/latest-mobile.json'

interface MobileUpdateManifest {
  version: string
  downloadUrl: string
  releaseUrl?: string
  publishedAt?: string
}

export interface UpdateInfo {
  available: boolean
  version?: string
  downloadUrl?: string
}

/**
 * Check a stable update manifest attached to the latest GitHub Release.
 * This avoids GitHub API rate limits on anonymous clients.
 */
export async function checkAndroidUpdate(): Promise<UpdateInfo> {
  try {
    const res = await fetch(MOBILE_UPDATE_MANIFEST_URL, { cache: 'no-store' })
    if (!res.ok) return { available: false }

    const manifest: MobileUpdateManifest = await res.json()
    const latestVersion = manifest.version
    const currentVersion = (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0')

    if (latestVersion === currentVersion) return { available: false }

    return {
      available: true,
      version: latestVersion,
      downloadUrl: manifest.downloadUrl,
    }
  } catch {
    return { available: false }
  }
}
