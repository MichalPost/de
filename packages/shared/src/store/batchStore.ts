import { create } from 'zustand'
import type { BatchGeneratedRecord } from '../features/batch/types'

type PrintMode = 'long' | 'short' | 'both' | 'auto'
type ViewMode = 'preview' | 'print'

interface BatchStore {
  records: BatchGeneratedRecord[]
  error: string | null
  running: boolean
  viewMode: ViewMode
  printMode: PrintMode
  printCols: number
  printPerPage: number
  currentPage: number
  agentOverride: string
  customerOverride: string
  serialCountOverride: string
  validUsesOverride: string
  preserveOverridesOnTemplateSwitch: boolean

  setRecords: (records: BatchGeneratedRecord[]) => void
  setError: (error: string | null) => void
  setRunning: (running: boolean) => void
  setViewMode: (mode: ViewMode) => void
  setPrintMode: (mode: PrintMode) => void
  setPrintCols: (cols: number) => void
  setPrintPerPage: (n: number) => void
  setCurrentPage: (page: number | ((prev: number) => number)) => void
  setAgentOverride: (v: string) => void
  setCustomerOverride: (v: string) => void
  setSerialCountOverride: (v: string) => void
  setValidUsesOverride: (v: string) => void
  setPreserveOverridesOnTemplateSwitch: (v: boolean) => void
}

export const useBatchStore = create<BatchStore>()((set) => ({
  records: [],
  error: null,
  running: false,
  viewMode: 'print',
  printMode: 'auto',
  printCols: 1,
  printPerPage: 10,
  currentPage: 0,
  agentOverride: '',
  customerOverride: '',
  serialCountOverride: '',
  validUsesOverride: '',
  preserveOverridesOnTemplateSwitch: true,

  setRecords: (records) => set({ records, currentPage: 0 }),
  setError: (error) => set({ error }),
  setRunning: (running) => set({ running }),
  setViewMode: (viewMode) => set({ viewMode }),
  setPrintMode: (printMode) => set({ printMode }),
  setPrintCols: (printCols) => set({ printCols }),
  setPrintPerPage: (printPerPage) => set({ printPerPage, currentPage: 0 }),
  setCurrentPage: (page) =>
    set((s) => ({ currentPage: typeof page === 'function' ? page(s.currentPage) : page })),
  setAgentOverride: (agentOverride) => set({ agentOverride }),
  setCustomerOverride: (customerOverride) => set({ customerOverride }),
  setSerialCountOverride: (serialCountOverride) => set({ serialCountOverride }),
  setValidUsesOverride: (validUsesOverride) => set({ validUsesOverride }),
  setPreserveOverridesOnTemplateSwitch: (preserveOverridesOnTemplateSwitch) => set({ preserveOverridesOnTemplateSwitch }),
}))
