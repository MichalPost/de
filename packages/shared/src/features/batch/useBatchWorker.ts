import { wrap } from 'comlink'
import { useRef, useEffect } from 'react'
import type { Remote } from 'comlink'
import type { TemplateDefinition, BatchGeneratedRecord } from './types'

export type BatchWorkerApi = {
  buildBatchCodes: (
    template: TemplateDefinition,
    input: {
      reagentIds: number[]
      agentIdOverride?: number
      customerIdOverride?: number
      validUsesOverride?: number
    },
    opts?: { generateSvg?: boolean },
  ) => Promise<BatchGeneratedRecord[]>
  parseReagentIds: (raw: string) => Promise<number[]>
}

export function useBatchWorker(workerUrl: URL): Remote<BatchWorkerApi> {
  const workerRef = useRef<Worker | null>(null)
  const apiRef = useRef<Remote<BatchWorkerApi> | null>(null)

  if (!workerRef.current) {
    workerRef.current = new Worker(workerUrl, { type: 'module' })
    apiRef.current = wrap<BatchWorkerApi>(workerRef.current)
  }

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  return apiRef.current!
}
