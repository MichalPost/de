import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    environmentMatchGlobs: [
      // React hook tests need jsdom
      ['src/**/*.test.tsx', 'jsdom'],
      ['src/features/**/*.test.ts', 'jsdom'],
      ['src/store/**/*.test.ts', 'jsdom'],
    ],
  },
})
