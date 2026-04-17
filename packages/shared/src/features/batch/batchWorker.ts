import { expose } from 'comlink'
import { buildBatchCodes, parseReagentIds } from './batchEngine'
import type { TemplateDefinition, BatchGeneratedRecord } from './types'

const api = {
  buildBatchCodes(
    template: TemplateDefinition,
    input: { reagentIds: number[]; agentIdOverride?: number; customerIdOverride?: number; validUsesOverride?: number },
    opts?: { generateSvg?: boolean },
  ): BatchGeneratedRecord[] {
    return buildBatchCodes(template, input, opts)
  },
  parseReagentIds(raw: string): number[] {
    return parseReagentIds(raw)
  },
}

expose(api)
