import { useMemo, useState } from 'react'
import { useDebounceFn } from 'ahooks'
import type { BatchGeneratedRecord } from './types'

export interface FilterState {
  query: string
}

export function useResultFilter(records: BatchGeneratedRecord[]) {
  const [query, setQueryRaw] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce the filter computation — avoids re-filtering on every keystroke
  // for large record sets. 150ms feels instant but skips intermediate states.
  const { run: setQuery } = useDebounceFn(
    (value: string) => {
      setQueryRaw(value)
      setDebouncedQuery(value)
    },
    { wait: 150 },
  )

  // Keep the input value in sync immediately for the controlled input
  const [inputValue, setInputValue] = useState('')
  const handleSetQuery = (value: string) => {
    setInputValue(value)
    setQuery(value)
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
