import { describe, expect, it } from 'vitest'
import { extractTrailingDigits } from './barcodeReader'

describe('extractTrailingDigits', () => {
  it('extracts the final number from a multiline QR payload', () => {
    const payload = [
      'RIA|V1|^^0^0^YQ-066209284|',
      '^2026/04/21^0^0^YQ-057505870|36|',
      '\\X04426010109|43384#',
    ].join('\n')

    // 5-digit result → auto-padded to 6 digits with leading zero
    expect(extractTrailingDigits(payload)).toBe('043384')
  })

  it('returns the last digit group even when non-digits follow it', () => {
    // 5 digits → padded to 6
    expect(extractTrailingDigits('abc-12-def-43384#done')).toBe('043384')
  })

  it('does not pad 6-digit numbers', () => {
    expect(extractTrailingDigits('payload-123456')).toBe('123456')
  })

  it('does not pad 4-digit numbers', () => {
    expect(extractTrailingDigits('payload-1234')).toBe('1234')
  })

  it('returns null when no digits exist', () => {
    expect(extractTrailingDigits('QR-CODE-ONLY')).toBeNull()
  })
})
