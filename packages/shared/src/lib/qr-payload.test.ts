import { describe, expect, it } from 'vitest'
import { parseQrPayload } from './qr-payload'

describe('parseQrPayload', () => {
  it('parses reagent-package QR payloads', () => {
    const parsed = parseQrPayload('RIA|V1|TEC260102^2025-12-27^44^49^SJ-066209284|TEC260102^2025-12-27^44^49^SJ-057505870|49|VX04A26010109|981226#')

    expect(parsed?.kind).toBe('reagent-package')
    expect(parsed?.sections[0].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '试剂包批号', value: 'TEC260102' }),
      expect.objectContaining({ label: '生产日期', value: '2025-12-27' }),
      expect.objectContaining({ label: '开包天数', value: '44' }),
      expect.objectContaining({ label: '使用次数', value: '49' }),
      expect.objectContaining({ label: '试剂包客户码', value: '066209284' }),
    ]))
    expect(parsed?.sections[1].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '改动后客户码', value: '057505870', highlight: true }),
      expect.objectContaining({ label: '附加字段', value: '49' }),
    ]))
    expect(parsed?.sections[0].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '试剂包批号', value: 'TEC260102', highlight: false }),
      expect.objectContaining({ label: '生产日期', value: '2025-12-27', highlight: false }),
      expect.objectContaining({ label: '开包天数', value: '44', highlight: false }),
      expect.objectContaining({ label: '使用次数', value: '49', highlight: false }),
      expect.objectContaining({ label: '试剂包客户码', value: '066209284', highlight: true }),
    ]))
    expect(parsed?.sections[2].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '仪器编号', value: 'VX04A26010109', highlight: false }),
      expect.objectContaining({ label: '加密数字', value: '981226', highlight: false }),
    ]))
  })

  it('parses instrument QR payloads', () => {
    const parsed = parseQrPayload('RIA|V1|~^~^0^0^YQ-066209284|~^2026/04/21^0^0^YQ-057505870|36|VX04A26010109|393709#')

    expect(parsed?.kind).toBe('instrument')
    expect(parsed?.sections[0].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '仪器客户码', value: '066209284', highlight: true }),
    ]))
    expect(parsed?.sections[1].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '时间', value: '2026/04/21', highlight: false }),
      expect.objectContaining({ label: '改动后客户码', value: '057505870', highlight: true }),
      expect.objectContaining({ label: '附加字段', value: '36' }),
    ]))
    expect(parsed?.sections[2].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '仪器编号', value: 'VX04A26010109', highlight: false }),
      expect.objectContaining({ label: '加密数字', value: '393709', highlight: false }),
    ]))
  })

  it('returns null for unsupported payloads', () => {
    expect(parseQrPayload('hello world')).toBeNull()
  })
})
