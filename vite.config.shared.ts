/**
 * Shared Vite configuration for all apps in this monorepo.
 * Merge this into each app's vite.config.ts using mergeConfig().
 * Note: alias is NOT set here — each app sets its own relative path.
 */
export const sharedViteConfig = {
  base: './',
  resolve: {
    dedupe: [
      'react', 'react-dom', 'react-router-dom',
      'zustand', 'motion', 'jsbarcode', 'zxing-wasm',
      'react-hook-form', '@hookform/resolvers', 'zod',
      'tailwind-merge', 'comlink', 'ahooks',
      'html2canvas', 'jspdf', 'svg2pdf.js',
      '@react-pdf/renderer', '@tanstack/react-virtual',
    ],
  },
  server: {
    fs: {
      allow: ['../..'],
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    cssMinify: false,
  },
}
