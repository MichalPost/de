import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // required for Capacitor and Tauri to load assets correctly
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
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  css: {
    transformer: 'postcss',
  },
  build: {
    chunkSizeWarningLimit: 1600,
    cssMinify: false,
  },
})
