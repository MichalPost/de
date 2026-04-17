export interface TemplateDefinition {
  id: string
  name: string
  // Business fields (manufacture date is always computed at runtime as 1 month ago)
  reagentId: number
  storageHalfMonths: number
  openHalfMonths: number
  validUses: number
  lotNumber: number
  serialNumber: number
  agentId: number
  customerId: number
  controlCode: number
  serialMode: 'fixed' | 'increment'
  // Generation type
  genMode: 'serial' | 'list'
  genCount: number
  genIdList: string
  // Per-ID print config (list mode only): comma-separated 'long'|'short'|'both', aligned with genIdList
  printConfig: string
  updatedAt: number
}

export interface BatchInput {
  reagentIds: number[]
  agentIdOverride?: number
  customerIdOverride?: number
  validUsesOverride?: number
}

export interface BatchGeneratedRecord {
  index: number
  reagentId: number
  serialNumber: number
  agentId: number
  customerId: number
  payloadHex: string
  encodedAscii: string
  encodedHex: string
  shortAscii: string
  shortHex: string
  longSvg: string
  shortSvg: string
  printMode: 'long' | 'short' | 'both'
}

export interface BatchHistoryEntry {
  id: string
  createdAt: number
  templateName: string
  recordCount: number
  records: BatchGeneratedRecord[]
  printMode: 'long' | 'short' | 'both' | 'auto'
  printCols: number
  printPerPage: number
}
