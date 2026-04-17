import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: './',
  resolve: {
    alias: {
      '@chemtools/shared': resolve(__dirname, '../../packages/shared/src'),
    },
    dedupe: [
      'react', 'react-dom', 'react-router-dom',
      'zustand', 'motion', 'jsbarcode', 'zxing-wasm',
      'react-hook-form', '@hookform/resolvers', 'zod',
      'tailwind-merge', 'comlink', 'ahooks',
      'html2canvas', 'jspdf', 'svg2pdf.js',
      '@react-pdf/renderer', '@tanstack/react-virtual',
    ],
  },
  // Tell Vite to also look in the app's node_modules when resolving
  // imports from packages/shared (which has no node_modules of its own)
  server: {
    fs: {
      allow: ['../..'],
    },
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
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    cssMinify: false,
  },
})
