import { describe, it, expect } from 'vitest'
import { buildLongCode, decodeLongCode, buildShortCode, buildLongPayloadHex } from './reagent-code'
import { LEGACY_FIXTURES } from './custom-algorithm'

const BASE_FIELDS = {
  reagentId: 43,
  manufactureYear: '13',
  manufactureMonth: '01',
  manufactureDay: '31',
  storageHalfMonths: 12,
  openHalfMonths: 2,
  validUses: 100,
  lotNumber: 1234,
  serialNumber: 1,
  agentId: 0,
  customerId: 0,
  controlCode: 7,
}

describe('buildLongCode', () => {
  it('produces the legacy fixture long ASCII', () => {
    const result = buildLongCode(BASE_FIELDS)
    expect(result.encodedAscii).toBe(LEGACY_FIXTURES.longAscii)
  })

  it('produces the legacy fixture short ASCII', () => {
    const result = buildLongCode(BASE_FIELDS)
    expect(result.shortAscii).toBe(LEGACY_FIXTURES.shortAscii)
  })

  it('round-trips: decode(encode) returns original fields', () => {
    const fields = { ...BASE_FIELDS, reagentId: 75, serialNumber: 42, agentId: 589, customerId: 3664 }
    const encoded = buildLongCode(fields)
    const decoded = decodeLongCode(encoded.decodeSourceHex)
    expect(decoded.fields.reagentId).toBe(fields.reagentId)
    expect(decoded.fields.serialNumber).toBe(fields.serialNumber)
    expect(decoded.fields.agentId).toBe(fields.agentId)
    expect(decoded.fields.customerId).toBe(fields.customerId)
    expect(decoded.fields.controlCode).toBe(fields.controlCode)
  })

  it('throws on out-of-range reagentId', () => {
    expect(() => buildLongCode({ ...BASE_FIELDS, reagentId: 256 })).toThrow()
  })

  it('throws on out-of-range controlCode', () => {
    expect(() => buildLongCode({ ...BASE_FIELDS, controlCode: 16 })).toThrow()
  })
})

describe('decodeLongCode', () => {
  it('decodes the legacy fixture decode source', () => {
    const result = decodeLongCode(LEGACY_FIXTURES.decodeSource)
    expect(result.fields.reagentId).toBe(BASE_FIELDS.reagentId)
    expect(result.fields.serialNumber).toBe(BASE_FIELDS.serialNumber)
    expect(result.fields.controlCode).toBe(BASE_FIELDS.controlCode)
  })

  it('outputHex matches legacy fixture', () => {
    const result = decodeLongCode(LEGACY_FIXTURES.decodeSource)
    expect(result.outputHex).toBe(LEGACY_FIXTURES.decodeHex)
  })

  it('throws on wrong-length input', () => {
    expect(() => decodeLongCode('deadbeef')).toThrow()
  })
})

describe('buildShortCode', () => {
  it('produces the legacy fixture short ASCII', () => {
    const result = buildShortCode(BASE_FIELDS.serialNumber, BASE_FIELDS.reagentId)
    expect(result.encodedAscii).toBe(LEGACY_FIXTURES.shortAscii)
  })
})

describe('buildLongPayloadHex', () => {
  it('returns a 34-char hex string (17 bytes)', () => {
    const hex = buildLongPayloadHex(BASE_FIELDS)
    expect(hex).toHaveLength(34)
  })
})
