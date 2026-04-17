import { encodeLongPayload, encodeShortPayload, decodeLongPayload } from './custom-algorithm'
import { bcdByteToNumber, bytesToHex, decimalToHexByte, hexToBytes, splitControlByte } from './utils'

export interface ReagentFormFields {
  reagentId: number
  manufactureYear: string
  manufactureMonth: string
  manufactureDay: string
  storageHalfMonths: number
  openHalfMonths: number
  validUses: number
  lotNumber: number
  serialNumber: number
  agentId: number
  customerId: number
  controlCode: number
}

export const DEFAULT_FORM_STATE: ReagentFormFields = Object.freeze({
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
})

function assertIntegerInRange(value: number | string, min: number, max: number, label: string): number {
  const numeric = Number(value)
  if (!Number.isInteger(numeric) || numeric < min || numeric > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}.`)
  }
  return numeric
}

function normalizeDatePart(value: number | string, min: number, max: number, label: string): string {
  const numeric = assertIntegerInRange(value, min, max, label)
  return String(numeric).padStart(2, '0')
}

export function buildLongPayloadHex(fields: ReagentFormFields): string {
  const reagentId = assertIntegerInRange(fields.reagentId, 0, 255, 'Reagent ID')
  const year = normalizeDatePart(fields.manufactureYear, 0, 99, 'Manufacture year')
  const month = normalizeDatePart(fields.manufactureMonth, 1, 12, 'Manufacture month')
  const day = normalizeDatePart(fields.manufactureDay, 1, 31, 'Manufacture day')
  const storageHalfMonths = assertIntegerInRange(fields.storageHalfMonths, 0, 255, 'Storage half-months')
  const openHalfMonths = assertIntegerInRange(fields.openHalfMonths, 0, 255, 'Open half-months')
  const validUses = assertIntegerInRange(fields.validUses, 0, 65535, 'Valid uses')
  const lotNumber = assertIntegerInRange(fields.lotNumber, 0, 65535, 'Lot number')
  const serialNumber = assertIntegerInRange(fields.serialNumber, 0, 65535, 'Serial number')
  const agentId = assertIntegerInRange(fields.agentId, 0, 65535, 'Agent ID')
  const customerId = assertIntegerInRange(fields.customerId, 0, 65535, 'Customer ID')
  const controlCode = assertIntegerInRange(fields.controlCode, 0, 15, 'Control code')

  return [
    decimalToHexByte(reagentId, 1),
    year,
    month,
    day,
    decimalToHexByte(storageHalfMonths, 1),
    decimalToHexByte(openHalfMonths, 1),
    decimalToHexByte(validUses, 2, true),
    decimalToHexByte(lotNumber, 2, true),
    decimalToHexByte(serialNumber, 2, true),
    decimalToHexByte(agentId, 2, true),
    decimalToHexByte(customerId, 2, true),
    decimalToHexByte(controlCode, 1, true),
  ].join('')
}

export function buildShortSerialHex(serialNumber: number | string): string {
  const serial = assertIntegerInRange(serialNumber, 0, 65535, 'Serial number')
  return decimalToHexByte(serial, 2, true)
}

export function decodeUnpackedFields(unpackedBytes: Uint8Array) {
  const control = splitControlByte(unpackedBytes[16])

  return {
    reagentId: unpackedBytes[0],
    manufactureYear: String(bcdByteToNumber(unpackedBytes[1])).padStart(2, '0'),
    manufactureMonth: String(bcdByteToNumber(unpackedBytes[2])).padStart(2, '0'),
    manufactureDay: String(bcdByteToNumber(unpackedBytes[3])).padStart(2, '0'),
    storageHalfMonths: unpackedBytes[4],
    openHalfMonths: unpackedBytes[5],
    validUses: unpackedBytes[6] + unpackedBytes[7] * 0x100,
    lotNumber: unpackedBytes[8] + unpackedBytes[9] * 0x100,
    serialNumber: unpackedBytes[10] + unpackedBytes[11] * 0x100,
    agentId: unpackedBytes[12] + unpackedBytes[13] * 0x100,
    customerId: unpackedBytes[14] + unpackedBytes[15] * 0x100,
    controlCode: control.controlCode,
    checksumNibble: control.checksumNibble,
  }
}

export function buildLongCode(fields: ReagentFormFields) {
  const payloadHex = buildLongPayloadHex(fields)
  const payloadBytes = hexToBytes(payloadHex)
  const longResult = encodeLongPayload(payloadBytes)
  const shortResult = encodeShortPayload(buildShortSerialHex(fields.serialNumber), fields.reagentId)
  const decoded = decodeLongCode(longResult.decodeSourceHex)

  return {
    payloadHex,
    encodedAscii: longResult.encodedAscii,
    encodedHex: longResult.encodedHex,
    decodeSourceHex: longResult.decodeSourceHex,
    plainHex: bytesToHex(longResult.plainBytes),
    shortAscii: shortResult.encodedAscii,
    shortHex: shortResult.encodedHex,
    decoded,
  }
}

export function decodeLongCode(sourceHex: string) {
  const decoded = decodeLongPayload(sourceHex)
  return {
    ...decoded,
    unpackedHex: bytesToHex(decoded.unpackedBytes),
    fields: decodeUnpackedFields(decoded.unpackedBytes),
  }
}

export function buildShortCode(serialNumber: number | string, reagentId: number) {
  return encodeShortPayload(buildShortSerialHex(serialNumber), reagentId)
}
