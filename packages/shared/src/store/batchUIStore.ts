import { create } from 'zustand'

export type PrintMode = 'long' | 'short' | 'both' | 'auto'
export type ViewMode = 'preview' | 'print'

interface BatchUIStore {
  viewMode: ViewMode
  printMode: PrintMode
  printCols: number
  printPerPage: number
  currentPage: number

  setViewMode: (mode: ViewMode) => void
  setPrintMode: (mode: PrintMode) => void
  setPrintCols: (cols: number) => void
  setPrintPerPage: (n: number) => void
  setCurrentPage: (page: number | ((prev: number) => number)) => void
}

export const useBatchUIStore = create<BatchUIStore>()((set) => ({
  viewMode: 'print',
  printMode: 'auto',
  printCols: 1,
  printPerPage: 10,
  currentPage: 0,

  setViewMode: (viewMode) => set({ viewMode }),
  setPrintMode: (printMode) => set({ printMode }),
  setPrintCols: (printCols) => set({ printCols }),
  setPrintPerPage: (printPerPage) => set({ printPerPage, currentPage: 0 }),
  setCurrentPage: (page) =>
    set((s) => ({ currentPage: typeof page === 'function' ? page(s.currentPage) : page })),
}))
