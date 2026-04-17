import { create } from 'zustand'

const STORAGE_KEY = 'reagent_decode_history'
const MAX_ENTRIES = 10

export interface DecodeHistoryEntry {
  id: string
  createdAt: number
  raw: string        // the input text (ASCII or hex)
  reagentId: number
  serialNumber: number
  agentId: number
  customerId: number
}

function load(): DecodeHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DecodeHistoryEntry[]
  } catch { /* ignore */ }
  return []
}

function save(entries: DecodeHistoryEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* ignore */ }
}

interface DecodeHistoryStore {
  entries: DecodeHistoryEntry[]
  addEntry: (entry: Omit<DecodeHistoryEntry, 'id' | 'createdAt'>) => void
  removeEntry: (id: string) => void
  clearAll: () => void
}

export const useDecodeHistoryStore = create<DecodeHistoryStore>()((set) => ({
  entries: load(),

  addEntry: (entry) =>
    set((s) => {
      // deduplicate by raw input
      const filtered = s.entries.filter((e) => e.raw !== entry.raw)
      const entries = [{ ...entry, id: crypto.randomUUID(), createdAt: Date.now() }, ...filtered].slice(0, MAX_ENTRIES)
      save(entries)
      return { entries }
    }),

  removeEntry: (id) =>
    set((s) => {
      const entries = s.entries.filter((e) => e.id !== id)
      save(entries)
      return { entries }
    }),

  clearAll: () => { localStorage.removeItem(STORAGE_KEY); return set({ entries: [] }) },
}))
