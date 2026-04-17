import { buildLongCode } from '../../lib/reagent-code'
import { createBarcodeSvg } from '../../lib/code128'
import type { TemplateDefinition, BatchInput, BatchGeneratedRecord } from './types'

function getManufactureDate() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return {
    manufactureYear: String(d.getFullYear()).slice(-2).padStart(2, '0'),
    manufactureMonth: String(d.getMonth() + 1).padStart(2, '0'),
    manufactureDay: String(d.getDate()).padStart(2, '0'),
  }
}

export function buildBatchCodes(
  template: TemplateDefinition,
  input: BatchInput,
  opts: { generateSvg?: boolean } = {},
): BatchGeneratedRecord[] {
  const generateSvg = opts.generateSvg ?? false
  const printConfigs = (template.printConfig || '')
    .split(/[,，\s]+/)
    .map(s => s.trim())
    .filter(Boolean) as ('long' | 'short' | 'both')[]

  return input.reagentIds.map((reagentId, i) => {
    const serialNumber =
      template.serialMode === 'increment'
        ? template.serialNumber + i
        : template.serialNumber

    const agentId = input.agentIdOverride ?? template.agentId
    const customerId = input.customerIdOverride ?? template.customerId
    const validUses = input.validUsesOverride ?? template.validUses

    const result = buildLongCode({
      reagentId,
      ...getManufactureDate(),
      storageHalfMonths: template.storageHalfMonths,
      openHalfMonths: template.openHalfMonths,
      validUses,
      lotNumber: template.lotNumber,
      serialNumber,
      agentId,
      customerId,
      controlCode: template.controlCode,
    })

    const longSvg = generateSvg
      ? createBarcodeSvg(result.encodedAscii, { moduleWidth: 1.4, height: 64, caption: false })
      : ''
    const shortSvg = generateSvg
      ? createBarcodeSvg(result.shortAscii, { moduleWidth: 2, height: 64, caption: false })
      : ''

    const printMode: 'long' | 'short' | 'both' = printConfigs[i] ?? 'long'

    return {
      index: i + 1,
      reagentId,
      serialNumber,
      agentId,
      customerId,
      payloadHex: result.payloadHex,
      encodedAscii: result.encodedAscii,
      encodedHex: result.encodedHex,
      shortAscii: result.shortAscii,
      shortHex: result.shortHex ?? '',
      longSvg,
      shortSvg,
      printMode,
    }
  })
}

export function parseReagentIds(raw: string): number[] {
  return raw
    .split(/[,，\s\n]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const n = parseInt(s, 10)
      if (isNaN(n) || n < 0 || n > 255) throw new Error(`无效编号: "${s}"，范围 0~255`)
      return n
    })
}
