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
    // Use lightningcss for faster, smaller CSS output (built into Vite 5+)
    cssMinify: 'lightningcss' as const,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached aggressively, changes rarely
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // PDF engine is large (~1MB+); split so it only loads on demand
          'vendor-pdf': ['@react-pdf/renderer', 'jspdf', 'svg2pdf.js'],
          // Canvas-based export; separate from PDF path
          'vendor-canvas': ['html2canvas'],
          // Barcode libs including WASM binary — heaviest single chunk
          'vendor-barcode': ['jsbarcode', 'zxing-wasm'],
          // Form validation stack
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // UI utilities — small but frequently updated
          'vendor-ui': ['motion', 'zustand', 'ahooks', 'tailwind-merge', 'comlink', '@tanstack/react-virtual'],
        },
      },
    },
  },
}
