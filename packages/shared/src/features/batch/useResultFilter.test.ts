// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResultFilter } from './useResultFilter'
import type { BatchGeneratedRecord } from './types'

function makeRecord(overrides: Partial<BatchGeneratedRecord>): BatchGeneratedRecord {
  return {
    index: 1,
    reagentId: 75,
    serialNumber: 1,
    agentId: 589,
    customerId: 3664,
    payloadHex: 'aabbcc',
    encodedAscii: 'LONGCODE',
    encodedHex: 'aabb',
    shortAscii: 'SHORT',
    shortHex: 'cc',
    longSvg: '',
    shortSvg: '',
    printMode: 'long',
    ...overrides,
  }
}

const RECORDS: BatchGeneratedRecord[] = [
  makeRecord({ index: 1, reagentId: 10, serialNumber: 100, agentId: 1, customerId: 2, encodedAscii: 'AAAA', shortAscii: 'AA' }),
  makeRecord({ index: 2, reagentId: 20, serialNumber: 200, agentId: 3, customerId: 4, encodedAscii: 'BBBB', shortAscii: 'BB' }),
  makeRecord({ index: 3, reagentId: 30, serialNumber: 300, agentId: 5, customerId: 6, encodedAscii: 'CCCC', shortAscii: 'CC' }),
]

describe('useResultFilter', () => {
  it('returns all records when query is empty', () => {
    const { result } = renderHook(() => useResultFilter(RECORDS))
    expect(result.current.filtered).toHaveLength(3)
    expect(result.current.total).toBe(3)
  })

  it('filters by reagentId', () => {
    const { result } = renderHook(() => useResultFilter(RECORDS))
    act(() => result.current.setQuery('20'))
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].reagentId).toBe(20)
  })

  it('filters by encodedAscii', () => {
    const { result } = renderHook(() => useResultFilter(RECORDS))
    act(() => result.current.setQuery('cccc'))
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].reagentId).toBe(30)
  })

  it('filters by serialNumber', () => {
    const { result } = renderHook(() => useResultFilter(RECORDS))
    act(() => result.current.setQuery('100'))
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].serialNumber).toBe(100)
  })

  it('matchCount reflects filtered count', () => {
    const { result } = renderHook(() => useResultFilter(RECORDS))
    act(() => result.current.setQuery('10'))
    expect(result.current.matchCount).toBe(1)
  })

  it('returns empty when no match', () => {
    const { result } = renderHook(() => useResultFilter(RECORDS))
    act(() => result.current.setQuery('zzz'))
    expect(result.current.filtered).toHaveLength(0)
  })
})
