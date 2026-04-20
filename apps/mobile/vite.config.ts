import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { sharedViteConfig } from '../../vite.config.shared'

export default defineConfig(
  mergeConfig(sharedViteConfig, {
    plugins: [tailwindcss(), react()],
    define: {
      // Injected at build time by CI via the VERSION env var; falls back to '0.0.0' locally
      __APP_VERSION__: JSON.stringify(process.env.VERSION ?? '0.0.0'),
    },
    resolve: {
      alias: {
        '@chemtools/shared': resolve(__dirname, '../../packages/shared/src'),
      },
    },
    css: {
      transformer: 'postcss',
    },
    optimizeDeps: {
      include: [
        'zustand', 'zustand/middleware',
        'motion/react',
        'jsbarcode',
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        'tailwind-merge',
        'comlink',
        'ahooks',
        'html2canvas',
        'jspdf',
        '@react-pdf/renderer',
        '@tanstack/react-virtual',
      ],
    },
  }),
)
