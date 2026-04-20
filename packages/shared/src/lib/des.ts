import { bytesToHex, hexToBytes } from './utils'

const IP = [
  58, 50, 42, 34, 26, 18, 10, 2,
  60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6,
  64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1,
  59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5,
  63, 55, 47, 39, 31, 23, 15, 7,
]

const IP_INV = [
  40, 8, 48, 16, 56, 24, 64, 32,
  39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30,
  37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28,
  35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26,
  33, 1, 41, 9, 49, 17, 57, 25,
]

const PC1 = [
  57, 49, 41, 33, 25, 17, 9,
  1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27,
  19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15,
  7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29,
  21, 13, 5, 28, 20, 12, 4,
]

const PC2 = [
  14, 17, 11, 24, 1, 5,
  3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8,
  16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55,
  30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53,
  46, 42, 50, 36, 29, 32,
]

const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]

const EXPANSION = [
  32, 1, 2, 3, 4, 5,
  4, 5, 6, 7, 8, 9,
  8, 9, 10, 11, 12, 13,
  12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21,
  20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29,
  28, 29, 30, 31, 32, 1,
]

const P = [
  16, 7, 20, 21,
  29, 12, 28, 17,
  1, 15, 23, 26,
  5, 18, 31, 10,
  2, 8, 24, 14,
  32, 27, 3, 9,
  19, 13, 30, 6,
  22, 11, 4, 25,
]

const S_BOXES = [
  [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
    [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
    [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
    [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
  ],
  [
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
    [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
    [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
    [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
  ],
  [
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
    [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
    [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
    [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
  ],
  [
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
    [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
    [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
    [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
  ],
  [
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
    [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
    [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
    [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
  ],
  [
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
    [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
    [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
    [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
  ],
  [
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
    [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
    [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
    [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
  ],
  [
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
    [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
    [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
    [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
  ],
]

function bytesToBits(bytes: Uint8Array): Uint8Array {
  const bits = new Uint8Array(bytes.length * 8)
  let i = 0
  for (const byte of bytes) {
    for (let index = 7; index >= 0; index -= 1) {
      bits[i++] = (byte >> index) & 1
    }
  }
  return bits
}

function bitsToBytes(bits: Uint8Array): Uint8Array {
  const result = new Uint8Array(bits.length / 8)
  for (let byteIndex = 0; byteIndex < result.length; byteIndex += 1) {
    let value = 0
    for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
      value = (value << 1) | bits[byteIndex * 8 + bitIndex]
    }
    result[byteIndex] = value
  }
  return result
}

function permute(bits: Uint8Array, table: number[]): Uint8Array {
  const out = new Uint8Array(table.length)
  for (let i = 0; i < table.length; i++) out[i] = bits[table[i] - 1]
  return out
}

function xorBits(left: Uint8Array, right: Uint8Array): Uint8Array {
  const out = new Uint8Array(left.length)
  for (let i = 0; i < left.length; i++) out[i] = left[i] ^ right[i]
  return out
}

function leftRotate(bits: Uint8Array, count: number): Uint8Array {
  const out = new Uint8Array(bits.length)
  const len = bits.length
  for (let i = 0; i < len; i++) out[i] = bits[(i + count) % len]
  return out
}

// Cache subkeys by hex-encoded key — batch generation reuses the same key for
// every record, so cache hit rate is ~100% in normal usage.
const subKeyCache = new Map<string, Uint8Array[]>()

function createSubKeys(keyBytes: Uint8Array): Uint8Array[] {
  // Build a cheap hex key for cache lookup without importing bytesToHex
  let cacheKey = ''
  for (const b of keyBytes) cacheKey += b.toString(16).padStart(2, '0')

  const cached = subKeyCache.get(cacheKey)
  if (cached) return cached

  const keyBits = permute(bytesToBits(keyBytes), PC1)
  let left = keyBits.slice(0, 28)
  let right = keyBits.slice(28)
  const subKeys: Uint8Array[] = []

  for (const shift of SHIFTS) {
    left = leftRotate(left, shift)
    right = leftRotate(right, shift)
    const combined = new Uint8Array(56)
    combined.set(left)
    combined.set(right, 28)
    subKeys.push(permute(combined, PC2))
  }

  subKeyCache.set(cacheKey, subKeys)
  return subKeys
}

function sBoxSubstitution(bits48: Uint8Array): Uint8Array {
  const output = new Uint8Array(32)
  let outIdx = 0

  for (let boxIndex = 0; boxIndex < 8; boxIndex += 1) {
    const base = boxIndex * 6
    const row = (bits48[base] << 1) | bits48[base + 5]
    const column = (bits48[base + 1] << 3) | (bits48[base + 2] << 2) | (bits48[base + 3] << 1) | bits48[base + 4]
    const value = S_BOXES[boxIndex][row][column]

    for (let bitIndex = 3; bitIndex >= 0; bitIndex -= 1) {
      output[outIdx++] = (value >> bitIndex) & 1
    }
  }

  return output
}

function desBlock(blockBytes: Uint8Array, keyBytes: Uint8Array, decrypt = false): Uint8Array {
  if (blockBytes.length !== 8 || keyBytes.length !== 8) {
    throw new Error('DES block encryption requires 8-byte input and 8-byte key.')
  }

  const subKeys = createSubKeys(keyBytes)
  const roundKeys = decrypt ? subKeys.slice().reverse() : subKeys
  const dataBits = permute(bytesToBits(blockBytes), IP)
  let left = dataBits.slice(0, 32)
  let right = dataBits.slice(32)

  for (const subKey of roundKeys) {
    const expanded = permute(right, EXPANSION)
    const mixed = xorBits(expanded, subKey)
    const substituted = sBoxSubstitution(mixed)
    const permuted = permute(substituted, P)
    const nextRight = xorBits(left, permuted)
    left = right
    right = nextRight
  }

  const combined = new Uint8Array(64)
  combined.set(right)
  combined.set(left, 32)
  return bitsToBytes(permute(combined, IP_INV))
}

export function encrypt3DESBlock(blockBytes: Uint8Array, keyBytes: Uint8Array): Uint8Array {
  if (keyBytes.length !== 16) {
    throw new Error('3DES requires a 16-byte key.')
  }

  const leftKey = keyBytes.slice(0, 8)
  const rightKey = keyBytes.slice(8, 16)
  return desBlock(desBlock(desBlock(blockBytes, leftKey, false), rightKey, true), leftKey, false)
}

export function decrypt3DESBlock(blockBytes: Uint8Array, keyBytes: Uint8Array): Uint8Array {
  if (keyBytes.length !== 16) {
    throw new Error('3DES requires a 16-byte key.')
  }

  const leftKey = keyBytes.slice(0, 8)
  const rightKey = keyBytes.slice(8, 16)
  return desBlock(desBlock(desBlock(blockBytes, leftKey, true), rightKey, false), leftKey, true)
}

export function process3DESBytes(dataBytes: Uint8Array, keyBytes: Uint8Array, decrypt = false): Uint8Array {
  if (keyBytes.length !== 16) {
    throw new Error('3DES requires a 16-byte key.')
  }

  const blockCount = Math.ceil(dataBytes.length / 8)
  const padded = new Uint8Array(blockCount * 8)
  padded.set(dataBytes)

  const output = new Uint8Array(padded.length)
  for (let index = 0; index < padded.length; index += 8) {
    const block = padded.slice(index, index + 8)
    const transformed = decrypt ? decrypt3DESBlock(block, keyBytes) : encrypt3DESBlock(block, keyBytes)
    output.set(transformed, index)
  }

  return output
}

export function encrypt3DESHex(plainHex: string, keyHex: string): string {
  const plaintext = hexToBytes(plainHex)
  const key = hexToBytes(keyHex)
  if (plaintext.length !== 16) {
    throw new Error('Plaintext must be exactly 16 bytes / 32 hex chars.')
  }
  return bytesToHex(process3DESBytes(plaintext, key, false)).slice(0, plaintext.length * 2)
}

export function decrypt3DESHex(cipherHex: string, keyHex: string): string {
  const ciphertext = hexToBytes(cipherHex)
  const key = hexToBytes(keyHex)
  if (ciphertext.length !== 16) {
    throw new Error('Ciphertext must be exactly 16 bytes / 32 hex chars.')
  }
  return bytesToHex(process3DESBytes(ciphertext, key, true)).slice(0, ciphertext.length * 2)
}
