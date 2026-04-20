import { create } from 'zustand'
import type { BatchHistoryEntry } from '../features/batch/types'

const STORAGE_KEY = 'reagent_batch_history'
const MAX_ENTRIES = 20

function loadHistory(): BatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as BatchHistoryEntry[]
  } catch { /* ignore */ }
  return []
}

// Use requestIdleCallback when available so localStorage writes don't block
// the main thread after the user triggers a generate action.
function saveHistory(entries: BatchHistoryEntry[]) {
  const write = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch { /* quota exceeded — ignore */ }
  }
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(write, { timeout: 2000 })
  } else {
    // Safari / older environments fallback
    setTimeout(write, 0)
  }
}

interface HistoryStore {
  entries: BatchHistoryEntry[]
  addEntry: (entry: Omit<BatchHistoryEntry, 'id' | 'createdAt'>) => void
  removeEntry: (id: string) => void
  clearAll: () => void
}

export const useHistoryStore = create<HistoryStore>()((set) => ({
  entries: loadHistory(),

  addEntry: (entry) =>
    set((s) => {
      const newEntry: BatchHistoryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      }
      const entries = [newEntry, ...s.entries].slice(0, MAX_ENTRIES)
      saveHistory(entries)
      return { entries }
    }),

  removeEntry: (id) =>
    set((s) => {
      const entries = s.entries.filter((e) => e.id !== id)
      saveHistory(entries)
      return { entries }
    }),

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    return set({ entries: [] })
  },
}))
