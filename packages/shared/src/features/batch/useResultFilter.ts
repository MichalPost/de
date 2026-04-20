import { useMemo, useRef, useState } from 'react'
import type { BatchGeneratedRecord } from './types'

export interface FilterState {
  query: string
}

export function useResultFilter(records: BatchGeneratedRecord[]) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSetQuery = (value: string) => {
    setInputValue(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQuery(value), 150)
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) => {
      return (
        String(r.reagentId).includes(q) ||
        String(r.agentId).includes(q) ||
        String(r.customerId).includes(q) ||
        String(r.serialNumber).includes(q) ||
        r.encodedAscii.toLowerCase().includes(q) ||
        r.shortAscii.toLowerCase().includes(q)
      )
    })
  }, [records, debouncedQuery])

  return { query: inputValue, setQuery: handleSetQuery, filtered, total: records.length, matchCount: filtered.length }
}
