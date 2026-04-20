const GITHUB_REPO = 'MichalPost/de'

interface GithubRelease {
  tag_name: string
  html_url: string
  assets: { name: string; browser_download_url: string }[]
}

export interface UpdateInfo {
  available: boolean
  version?: string
  downloadUrl?: string
}

/**
 * Check GitHub Releases for a newer APK version.
 * Compares against __APP_VERSION__ injected by Vite at build time.
 */
export async function checkAndroidUpdate(): Promise<UpdateInfo> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github+json' } },
    )
    if (!res.ok) return { available: false }

    const release: GithubRelease = await res.json()
    const latestVersion = release.tag_name.replace(/^v/, '')
    const currentVersion = (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0')

    if (latestVersion === currentVersion) return { available: false }

    const apk = release.assets.find(a => a.name.endsWith('.apk'))
    return {
      available: true,
      version: latestVersion,
      downloadUrl: apk?.browser_download_url ?? release.html_url,
    }
  } catch {
    return { available: false }
  }
}
