import { describe, it, expect } from 'vitest'
import { calculateShift } from './bit-shift'

describe('calculateShift — right shift', () => {
  it('right-shifts decimal by 2, padding 0', () => {
    // 0b11001100 (204) >> 2 = 0b00110011 (51)
    const r = calculateShift({ number: '204', base: '10', shift: 2, method: '>>', padding: 0 })
    expect(r.decResult).toBe(51)
    expect(r.binResult).toBe('00110011')
  })

  it('right-shifts with padding 1', () => {
    // 0b11001100 (204) >> 2 (pad 1) = 0b11110011 (243)
    const r = calculateShift({ number: '204', base: '10', shift: 2, method: '>>', padding: 1 })
    expect(r.decResult).toBe(243)
    expect(r.binResult).toBe('11110011')
  })

  it('right-shifts by full width returns all padding', () => {
    const r = calculateShift({ number: '255', base: '10', shift: 8, method: '>>', padding: 0 })
    expect(r.decResult).toBe(0)
  })

  it('right-shifts hex input', () => {
    // 0xFF (255) >> 4 = 0x0F (15)
    const r = calculateShift({ number: 'FF', base: '16', shift: 4, method: '>>', padding: 0 })
    expect(r.decResult).toBe(15)
    expect(r.hexResult).toBe('F')
  })
})

describe('calculateShift — left shift', () => {
  it('left-shifts decimal by 2, padding 0', () => {
    // 0b00110011 (51) << 2 = 0b11001100 (204)
    const r = calculateShift({ number: '51', base: '10', shift: 2, method: '<<', padding: 0 })
    expect(r.decResult).toBe(204)
    expect(r.binResult).toBe('11001100')
  })

  it('left-shifts with padding 1', () => {
    // 0b00110011 (51) << 2 (pad 1) = 0b11001111 (207)
    const r = calculateShift({ number: '51', base: '10', shift: 2, method: '<<', padding: 1 })
    expect(r.decResult).toBe(207)
  })

  it('left-shifts binary input', () => {
    const r = calculateShift({ number: '00001111', base: '2', shift: 4, method: '<<', padding: 0 })
    expect(r.binResult).toBe('11110000')
    expect(r.decResult).toBe(240)
  })
})

describe('calculateShift — edge cases', () => {
  it('throws on negative input', () => {
    expect(() => calculateShift({ number: '-1', base: '10', shift: 1, method: '>>', padding: 0 })).toThrow()
  })

  it('throws on non-numeric input', () => {
    expect(() => calculateShift({ number: 'xyz', base: '10', shift: 1, method: '>>', padding: 0 })).toThrow()
  })

  it('handles zero', () => {
    const r = calculateShift({ number: '0', base: '10', shift: 4, method: '>>', padding: 0 })
    expect(r.decResult).toBe(0)
  })

  it('preserves original value in result', () => {
    const r = calculateShift({ number: '42', base: '10', shift: 1, method: '>>', padding: 0 })
    expect(r.decOriginal).toBe(42)
    expect(r.hexOriginal).toBe('2A')
  })
})
