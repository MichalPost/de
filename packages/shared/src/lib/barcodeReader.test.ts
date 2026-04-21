import { describe, expect, it } from 'vitest'
import { extractTrailingDigits } from './barcodeReader'

describe('extractTrailingDigits', () => {
  it('extracts the final number from a multiline QR payload', () => {
    const payload = [
      'RIA|V1|^^0^0^YQ-066209284|',
      '^2026/04/21^0^0^YQ-057505870|36|',
      '\\X04426010109|43384#',
    ].join('\n')

    expect(extractTrailingDigits(payload)).toBe('43384')
  })

  it('returns the last digit group even when non-digits follow it', () => {
    expect(extractTrailingDigits('abc-12-def-43384#done')).toBe('43384')
  })

  it('returns null when no digits exist', () => {
    expect(extractTrailingDigits('QR-CODE-ONLY')).toBeNull()
  })
})
