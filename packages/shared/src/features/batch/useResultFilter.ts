import { useMemo, useState } from 'react'
import type { BatchGeneratedRecord } from './types'

export interface FilterState {
  query: string
}

export function useResultFilter(records: BatchGeneratedRecord[]) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
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
  }, [records, query])

  return { query, setQuery, filtered, total: records.length, matchCount: filtered.length }
}
