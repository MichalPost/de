import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sharedViteConfig, resolve } from '../../vite.config.shared'

export default defineConfig(
  mergeConfig(sharedViteConfig, {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@chemtools/shared': resolve(__dirname, '../../packages/shared/src'),
      },
    },
    css: {
      transformer: 'postcss',
    },
  }),
)
