import { decrypt3DESBlock, encrypt3DESBlock } from './des'
import { asciiToBytes, bytesToAscii, bytesToHex, hexToBytes } from './utils'

const BARCODE_ENCODE_KEY = Uint8Array.from([
  0x8e, 0x4f, 0xd9, 0x22, 0x14, 0x15, 0x08, 0x47,
  0x80, 0x32, 0x21, 0xf5, 0xb4, 0xa6, 0x95, 0xd6,
])

function ensureLength(bytes: Uint8Array, expected: number, label: string): void {
  if (bytes.length !== expected) {
    throw new Error(`${label} must contain exactly ${expected} bytes.`)
  }
}

function hex2bcd8(value: number): number {
  return (Math.floor(value / 10) << 4) + (value % 10)
}

function bcd2hex8(value: number): number {
  return Math.floor(value / 16) * 10 + (value & 0x0f)
}

function convert69ToHexBlock(block: Uint8Array): Uint8Array {
  let power = 1
  let value = block[0] - 58
  power *= 69
  value += (block[1] - 58) * power
  power *= 69
  value += (block[2] - 58) * power
  power *= 69
  value += (block[3] - 58) * power

  return Uint8Array.from([
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
  ])
}

function hexTo69Block(block: Uint8Array): Uint8Array {
  let value = block[2] * 0x10000 + block[1] * 0x100 + block[0]
  const chars = new Uint8Array(4)

  const third = 69 * 69 * 69
  let quotient = Math.floor(value / third)
  let remainder = value % third
  chars[3] = quotient + 58

  const second = 69 * 69
  quotient = Math.floor(remainder / second)
  remainder %= second
  chars[2] = quotient + 58

  quotient = Math.floor(remainder / 69)
  remainder %= 69
  chars[1] = quotient + 58
  chars[0] = remainder + 58

  return chars
}

export function convert69ToHex(source: string | Uint8Array): Uint8Array {
  const sourceBytes = typeof source === 'string' ? asciiToBytes(source) : source
  ensureLength(sourceBytes, 22, '69-base payload')

  const output = new Uint8Array(16)
  for (let index = 0; index < 5; index += 1) {
    output.set(convert69ToHexBlock(sourceBytes.slice(index * 4, index * 4 + 4)), index * 3)
  }
  output[15] = ((sourceBytes[20] - 65) << 4) + (sourceBytes[21] - 65)
  return output
}

export function hexTo69(bytes: Uint8Array): Uint8Array {
  ensureLength(bytes, 16, 'Encoded barcode bytes')

  const output = new Uint8Array(23)
  output[0] = 42
  for (let index = 0; index < 5; index += 1) {
    output.set(hexTo69Block(bytes.slice(index * 3, index * 3 + 3)), index * 4 + 1)
  }
  output[21] = ((bytes[15] >> 4) & 0x0f) + 65
  output[22] = (bytes[15] & 0x0f) + 65
  return output
}

export function hexTo69Short(bytes: Uint8Array): Uint8Array {
  ensureLength(bytes, 3, 'Short barcode payload')
  return hexTo69Block(bytes)
}

export function packPlainBarcode(rawBarcode: Uint8Array, controlCode: number): Uint8Array {
  ensureLength(rawBarcode, 16, 'Raw barcode payload')
  const packed = new Uint8Array(16).fill(0xff)

  packed[0] = rawBarcode[0]
  packed[1] = bcd2hex8(rawBarcode[1])
  packed[2] = bcd2hex8(rawBarcode[2])
  packed[14] = bcd2hex8(rawBarcode[3])
  packed[3] = rawBarcode[4]
  packed[4] = rawBarcode[5]
  packed[5] = rawBarcode[6]
  packed[6] = rawBarcode[7]
  packed[7] = rawBarcode[10]
  packed[8] = rawBarcode[11]

  let mixed = rawBarcode[12]
  mixed += rawBarcode[13] * 0x100
  mixed *= 0x1000
  mixed += rawBarcode[8] + ((rawBarcode[9] & 0x0f) << 8)

  packed[9] = mixed & 0xff
  packed[10] = (mixed >> 8) & 0xff
  packed[11] = (mixed >> 16) & 0xff
  packed[12] = rawBarcode[14]
  packed[13] = rawBarcode[15]

  let checksum = 0
  for (const byte of rawBarcode) {
    checksum += byte
  }
  packed[15] = ((checksum & 0x0f) << 4) + (controlCode & 0x0f)

  return packed
}

export function unpackBarcode(plainBarcode: Uint8Array): Uint8Array {
  ensureLength(plainBarcode, 16, 'Plain barcode bytes')
  const unpacked = new Uint8Array(17)

  unpacked[0] = plainBarcode[0]
  unpacked[1] = hex2bcd8(plainBarcode[1])
  unpacked[2] = hex2bcd8(plainBarcode[2])
  unpacked[3] = hex2bcd8(plainBarcode[14])
  unpacked[4] = plainBarcode[3]
  unpacked[5] = plainBarcode[4]
  unpacked[6] = plainBarcode[5]
  unpacked[7] = plainBarcode[6]
  unpacked[10] = plainBarcode[7]
  unpacked[11] = plainBarcode[8]

  const mixed = plainBarcode[9] + plainBarcode[10] * 0x100 + plainBarcode[11] * 0x10000
  unpacked[8] = mixed & 0xff
  unpacked[9] = (mixed >> 8) & 0x0f
  unpacked[12] = (mixed >> 12) & 0xff
  unpacked[13] = (mixed >> 20) & 0x0f
  unpacked[14] = plainBarcode[12]
  unpacked[15] = plainBarcode[13]
  unpacked[16] = plainBarcode[15]

  return unpacked
}

function transformLegacyBlock(bytes: Uint8Array, decrypt = false): Uint8Array {
  ensureLength(bytes, 16, decrypt ? 'Encrypted payload' : 'Plain payload')
  const output = new Uint8Array(16)

  for (let index = 0; index < 16; index += 8) {
    const block = bytes.slice(index, index + 8)
    const transformed = decrypt ? decrypt3DESBlock(block, BARCODE_ENCODE_KEY) : encrypt3DESBlock(block, BARCODE_ENCODE_KEY)
    output.set(transformed, index)
  }

  return output
}

export function encodeLongPayload(rawPayload: Uint8Array) {
  ensureLength(rawPayload, 17, 'Long barcode payload')
  const plain = packPlainBarcode(rawPayload.slice(0, 16), rawPayload[16])
  const encrypted = transformLegacyBlock(plain, false)
  const encoded = hexTo69(encrypted)

  return {
    plainBytes: plain,
    encryptedBytes: encrypted,
    encodedBytes: encoded,
    encodedAscii: bytesToAscii(encoded),
    encodedHex: bytesToHex(encoded),
    decodeSourceHex: bytesToHex(encoded.slice(1)),
  }
}

export function decodeLongPayload(source: string | Uint8Array) {
  const sourceBytes = typeof source === 'string' ? hexToBytes(source) : source
  ensureLength(sourceBytes, 22, 'Encoded long barcode source')

  const encrypted = convert69ToHex(sourceBytes)
  const plain = transformLegacyBlock(encrypted, true)
  const unpacked = unpackBarcode(plain)
  const full = new Uint8Array(18)
  full[0] = 1
  full.set(unpacked, 1)

  return {
    encryptedBytes: encrypted,
    plainBytes: plain,
    unpackedBytes: unpacked,
    outputBytes: full,
    outputHex: bytesToHex(full),
  }
}

export function encodeShortPayload(serialLittleEndianHex: string, reagentId: number) {
  const serialBytes = hexToBytes(serialLittleEndianHex)
  ensureLength(serialBytes, 2, 'Short barcode serial')

  const payload = Uint8Array.from([serialBytes[0], serialBytes[1], Number(reagentId)])
  const encoded = new Uint8Array(5)
  encoded[0] = 35
  encoded.set(hexTo69Short(payload), 1)

  return {
    payloadBytes: payload,
    encodedBytes: encoded,
    encodedAscii: bytesToAscii(encoded),
    encodedHex: bytesToHex(encoded),
  }
}

export const LEGACY_FIXTURES = Object.freeze({
  longAscii: '*zvKkPmUg_;Ck>Zr<IPvXCJ',
  longHex: '2a7a764b6b506d55675f3b436b3e5a723c49507658434a',
  decodeSource: '7a764b6b506d55675f3b436b3e5a723c49507658434a',
  decodeHex: '012b1301310c026400d20401000000000097',
  shortAscii: '#NxaB',
  shortHex: '234e786142',
  tripleDesEncrypted: 'b617937bcca608bf3370b59ecff8669f',
  tripleDesDecrypted: '39fd0c079a9d2c4be9714f4080d61e00',
})
