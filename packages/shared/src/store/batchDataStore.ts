import { create } from 'zustand'
import type { BatchGeneratedRecord } from '../features/batch/types'

interface BatchDataStore {
  records: BatchGeneratedRecord[]
  error: string | null
  running: boolean
  agentOverride: string
  customerOverride: string
  serialCountOverride: string
  validUsesOverride: string
  preserveOverridesOnTemplateSwitch: boolean

  setRecords: (records: BatchGeneratedRecord[]) => void
  setError: (error: string | null) => void
  setRunning: (running: boolean) => void
  setAgentOverride: (v: string) => void
  setCustomerOverride: (v: string) => void
  setSerialCountOverride: (v: string) => void
  setValidUsesOverride: (v: string) => void
  setPreserveOverridesOnTemplateSwitch: (v: boolean) => void
}

export const useBatchDataStore = create<BatchDataStore>()((set) => ({
  records: [],
  error: null,
  running: false,
  agentOverride: '',
  customerOverride: '',
  serialCountOverride: '',
  validUsesOverride: '',
  preserveOverridesOnTemplateSwitch: true,

  setRecords: (records) => set({ records }),
  setError: (error) => set({ error }),
  setRunning: (running) => set({ running }),
  setAgentOverride: (agentOverride) => set({ agentOverride }),
  setCustomerOverride: (customerOverride) => set({ customerOverride }),
  setSerialCountOverride: (serialCountOverride) => set({ serialCountOverride }),
  setValidUsesOverride: (validUsesOverride) => set({ validUsesOverride }),
  setPreserveOverridesOnTemplateSwitch: (preserveOverridesOnTemplateSwitch) =>
    set({ preserveOverridesOnTemplateSwitch }),
}))
