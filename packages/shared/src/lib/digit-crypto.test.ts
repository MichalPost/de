import { describe, it, expect } from 'vitest'
import { processDigitCrypto } from './digit-crypto'

const DIGIT_KEY = 7
const GLOBAL_KEY = 12345

describe('digit-crypto — encrypt', () => {
  it('encrypts a 6-digit number', () => {
    const r = processDigitCrypto({ number: '123456', digitKey: DIGIT_KEY, globalKey: GLOBAL_KEY, operation: 'encrypt' })
    expect(r.originalNumber).toBe('123456')
    expect(r.finalResult).not.toBe('123456')
  })

  it('digit step applies mod-10 per digit', () => {
    // digit key 7: 1→8, 2→9, 3→0, 4→1, 5→2, 6→3
    const r = processDigitCrypto({ number: '123456', digitKey: 7, globalKey: 0, operation: 'encrypt' })
    expect(r.digitStepResult).toBe('890123')
    expect(r.finalResult).toBe('890123') // globalKey=0, no offset
  })

  it('global step adds globalKey', () => {
    const r = processDigitCrypto({ number: '000000', digitKey: 0, globalKey: 100, operation: 'encrypt' })
    expect(parseInt(r.finalResult)).toBe(100)
  })

  it('decryptedResult matches original after encrypt', () => {
    const r = processDigitCrypto({ number: '987654', digitKey: DIGIT_KEY, globalKey: GLOBAL_KEY, operation: 'encrypt' })
    expect(r.decryptedResult).toBe('987654')
  })
})

describe('digit-crypto — decrypt', () => {
  it('round-trips: decrypt(encrypt(x)) === x', () => {
    const original = '123456'
    const enc = processDigitCrypto({ number: original, digitKey: DIGIT_KEY, globalKey: GLOBAL_KEY, operation: 'encrypt' })
    const dec = processDigitCrypto({ number: enc.finalResult, digitKey: DIGIT_KEY, globalKey: GLOBAL_KEY, operation: 'decrypt' })
    expect(dec.decryptedResult).toBe(original)
  })

  it('throws when global offset produces negative', () => {
    expect(() =>
      processDigitCrypto({ number: '100', digitKey: 0, globalKey: 99999, operation: 'decrypt' })
    ).toThrow('负')
  })
})

describe('digit-crypto — validation', () => {
  it('throws on non-digit input', () => {
    expect(() =>
      processDigitCrypto({ number: 'abc', digitKey: 0, globalKey: 0, operation: 'encrypt' })
    ).toThrow()
  })

  it('throws on empty input', () => {
    expect(() =>
      processDigitCrypto({ number: '', digitKey: 0, globalKey: 0, operation: 'encrypt' })
    ).toThrow()
  })
})
