export interface ParsedQrField {
  label: string
  value: string
  highlight?: boolean
}

export interface ParsedQrSection {
  title: string
  fields: ParsedQrField[]
}

export interface ParsedQrPayload {
  kind: 'reagent-package' | 'instrument'
  title: string
  sections: ParsedQrSection[]
}

function stripSuffix(value: string): string {
  return value.replace(/#$/, '').trim()
}

function stripCodePrefix(value: string): string {
  return value.replace(/^[A-Z]+-/, '')
}

function parseCaretSegment(segment: string): string[] {
  return segment.split('^').map(part => part.trim())
}

function pushField(fields: ParsedQrField[], label: string, value: string | undefined, highlight = false) {
  const clean = value?.trim()
  if (!clean) return
  fields.push({ label, value: clean, highlight })
}

function parseReagentPackage(parts: string[]): ParsedQrPayload | null {
  if (parts.length < 7) return null
  const original = parseCaretSegment(parts[2])
  const updated = parseCaretSegment(parts[3])
  if (original.length < 5 || updated.length < 5) return null

  const originalFields: ParsedQrField[] = []
  pushField(originalFields, '试剂包批号', original[0])
  pushField(originalFields, '生产日期', original[1])
  pushField(originalFields, '开包天数', original[2])
  pushField(originalFields, '使用次数', original[3])
  pushField(originalFields, '试剂包客户码', stripCodePrefix(original[4]))

  const updatedFields: ParsedQrField[] = []
  pushField(updatedFields, '试剂包批号', updated[0])
  pushField(updatedFields, '生产日期', updated[1])
  pushField(updatedFields, '开包天数', updated[2])
  pushField(updatedFields, '使用次数', updated[3])
  pushField(updatedFields, '改动后客户码', stripCodePrefix(updated[4]), true)
  pushField(updatedFields, '附加字段', parts[4])

  const deviceFields: ParsedQrField[] = []
  pushField(deviceFields, '仪器编号', parts[5], true)
  pushField(deviceFields, '加密数字', stripSuffix(parts[6]), true)

  return {
    kind: 'reagent-package',
    title: '试剂包二维码解析结果',
    sections: [
      { title: '原始信息', fields: originalFields },
      { title: '改动后信息', fields: updatedFields },
      { title: '关联设备', fields: deviceFields },
    ],
  }
}

function parseInstrument(parts: string[]): ParsedQrPayload | null {
  if (parts.length < 7) return null
  const original = parseCaretSegment(parts[2])
  const updated = parseCaretSegment(parts[3])
  if (original.length < 5 || updated.length < 5) return null

  const originalFields: ParsedQrField[] = []
  pushField(originalFields, '仪器客户码', stripCodePrefix(original[4]))

  const updatedFields: ParsedQrField[] = []
  pushField(updatedFields, '时间', updated[1])
  pushField(updatedFields, '改动后客户码', stripCodePrefix(updated[4]), true)
  pushField(updatedFields, '附加字段', parts[4])

  const deviceFields: ParsedQrField[] = []
  pushField(deviceFields, '仪器编号', parts[5], true)
  pushField(deviceFields, '加密数字', stripSuffix(parts[6]), true)

  return {
    kind: 'instrument',
    title: '仪器二维码解析结果',
    sections: [
      { title: '原始信息', fields: originalFields },
      { title: '改动后信息', fields: updatedFields },
      { title: '设备信息', fields: deviceFields },
    ],
  }
}

export function parseQrPayload(raw: string): ParsedQrPayload | null {
  const normalized = raw.trim()
  if (!normalized.startsWith('RIA|V1|')) return null

  const parts = normalized.split('|')
  if (parts.length < 7) return null

  const secondSegment = parseCaretSegment(parts[3])
  const isInstrument = secondSegment[0] === '~' || secondSegment[0] === ''
  return isInstrument ? parseInstrument(parts) : parseReagentPackage(parts)
}
