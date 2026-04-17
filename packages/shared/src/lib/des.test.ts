import { describe, it, expect } from 'vitest'
import { encrypt3DESHex, decrypt3DESHex } from './des'
import { LEGACY_FIXTURES } from './custom-algorithm'

describe('3DES encryption', () => {
  const KEY = '11223344556677888877665544332211'

  it('encrypts the legacy fixture plaintext', () => {
    const cipher = encrypt3DESHex(LEGACY_FIXTURES.tripleDesDecrypted, KEY)
    expect(cipher).toBe(LEGACY_FIXTURES.tripleDesEncrypted)
  })

  it('decrypts the legacy fixture ciphertext', () => {
    const plain = decrypt3DESHex(LEGACY_FIXTURES.tripleDesEncrypted, KEY)
    expect(plain).toBe(LEGACY_FIXTURES.tripleDesDecrypted)
  })

  it('round-trips: decrypt(encrypt(x)) === x', () => {
    const original = '0123456789abcdef0123456789abcdef'
    const encrypted = encrypt3DESHex(original, KEY)
    const decrypted = decrypt3DESHex(encrypted, KEY)
    expect(decrypted).toBe(original)
  })

  it('throws on wrong-length plaintext', () => {
    expect(() => encrypt3DESHex('deadbeef', KEY)).toThrow('16 bytes')
  })

  it('throws on wrong-length key', () => {
    expect(() => encrypt3DESHex(LEGACY_FIXTURES.tripleDesDecrypted, 'deadbeef')).toThrow('16-byte key')
  })
})
