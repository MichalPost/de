import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.chemtools.webapp',
<<<<<<< HEAD
  appName: '化工助手',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    // Correctly handle safe areas (notch / home indicator) to avoid layout shifts
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      // Shorter splash = faster perceived startup
      launchShowDuration: 500,
      launchAutoHide: true,
    },
  },
}

export default config
