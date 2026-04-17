import { describe, it, expect } from 'vitest'
import { parseReagentIds, buildBatchCodes } from './batchEngine'
import type { TemplateDefinition } from './types'

const baseTemplate: TemplateDefinition = {
  id: 'test',
  name: '测试模板',
  reagentId: 75,
  storageHalfMonths: 48,
  openHalfMonths: 4,
  validUses: 1500,
  lotNumber: 1234,
  serialNumber: 1,
  agentId: 589,
  customerId: 3664,
  controlCode: 7,
  serialMode: 'increment',
  genMode: 'serial',
  genCount: 3,
  genIdList: '',
  printConfig: '',
  updatedAt: Date.now(),
}

describe('parseReagentIds', () => {
  it('parses comma-separated ids', () => {
    expect(parseReagentIds('1, 2, 3')).toEqual([1, 2, 3])
  })

  it('parses newline-separated ids', () => {
    expect(parseReagentIds('10\n20\n30')).toEqual([10, 20, 30])
  })

  it('parses Chinese comma', () => {
    expect(parseReagentIds('5，10，15')).toEqual([5, 10, 15])
  })

  it('throws on out-of-range value', () => {
    expect(() => parseReagentIds('256')).toThrow('无效编号')
  })

  it('throws on negative value', () => {
    expect(() => parseReagentIds('-1')).toThrow('无效编号')
  })

  it('ignores empty tokens', () => {
    expect(parseReagentIds('  1  ,  ,  2  ')).toEqual([1, 2])
  })
})

describe('buildBatchCodes', () => {
  it('returns correct count of records', () => {
    const records = buildBatchCodes(baseTemplate, { reagentIds: [1, 2, 3] })
    expect(records).toHaveLength(3)
  })

  it('increments serialNumber when serialMode is increment', () => {
    const records = buildBatchCodes(baseTemplate, { reagentIds: [1, 2, 3] })
    expect(records[0].serialNumber).toBe(1)
    expect(records[1].serialNumber).toBe(2)
    expect(records[2].serialNumber).toBe(3)
  })

  it('keeps fixed serialNumber when serialMode is fixed', () => {
    const t = { ...baseTemplate, serialMode: 'fixed' as const }
    const records = buildBatchCodes(t, { reagentIds: [1, 2, 3] })
    expect(records[0].serialNumber).toBe(1)
    expect(records[1].serialNumber).toBe(1)
    expect(records[2].serialNumber).toBe(1)
  })

  it('applies agentIdOverride', () => {
    const records = buildBatchCodes(baseTemplate, { reagentIds: [1], agentIdOverride: 999 })
    expect(records[0].agentId).toBe(999)
  })

  it('applies customerIdOverride', () => {
    const records = buildBatchCodes(baseTemplate, { reagentIds: [1], customerIdOverride: 12345 })
    expect(records[0].customerId).toBe(12345)
  })

  it('defaults printMode to long when printConfig is empty', () => {
    const records = buildBatchCodes(baseTemplate, { reagentIds: [1, 2] })
    expect(records[0].printMode).toBe('long')
    expect(records[1].printMode).toBe('long')
  })

  it('applies per-record printConfig', () => {
    const t = { ...baseTemplate, printConfig: 'long,short,both' }
    const records = buildBatchCodes(t, { reagentIds: [1, 2, 3] })
    expect(records[0].printMode).toBe('long')
    expect(records[1].printMode).toBe('short')
    expect(records[2].printMode).toBe('both')
  })

  it('does not generate SVG by default', () => {
    const records = buildBatchCodes(baseTemplate, { reagentIds: [1] })
    expect(records[0].longSvg).toBe('')
    expect(records[0].shortSvg).toBe('')
  })

  it('generates SVG when generateSvg is true', () => {
    const records = buildBatchCodes(baseTemplate, { reagentIds: [1] }, { generateSvg: true })
    expect(records[0].longSvg).not.toBe('')
    expect(records[0].shortSvg).not.toBe('')
  })

  it('sets correct index (1-based)', () => {
    const records = buildBatchCodes(baseTemplate, { reagentIds: [10, 20, 30] })
    expect(records.map(r => r.index)).toEqual([1, 2, 3])
  })
})
