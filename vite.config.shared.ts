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
        // Vite 8 (rolldown) requires manualChunks as a function, not an object
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return
          if (id.includes('@react-pdf') || id.includes('jspdf') || id.includes('svg2pdf')) return 'vendor-pdf'
          if (id.includes('html2canvas')) return 'vendor-canvas'
          if (id.includes('jsbarcode') || id.includes('zxing-wasm')) return 'vendor-barcode'
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) return 'vendor-form'
          if (id.includes('motion') || id.includes('zustand') || id.includes('ahooks') || id.includes('tailwind-merge') || id.includes('comlink') || id.includes('@tanstack')) return 'vendor-ui'
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) return 'vendor-react'
        },
      },
    },
  },
}
