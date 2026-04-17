import { wrap } from 'comlink'
import { useRef, useEffect } from 'react'
import type { Remote } from 'comlink'

type BatchWorkerApi = {
  buildBatchCodes: (
    template: import('./types').TemplateDefinition,
    input: {
      reagentIds: number[]
      agentIdOverride?: number
      customerIdOverride?: number
      validUsesOverride?: number
    },
    opts?: { generateSvg?: boolean },
  ) => Promise<import('./types').BatchGeneratedRecord[]>
  parseReagentIds: (raw: string) => Promise<number[]>
}

export function useBatchWorker(): Remote<BatchWorkerApi> {
  const workerRef = useRef<Worker | null>(null)
  const apiRef = useRef<Remote<BatchWorkerApi> | null>(null)

  if (!workerRef.current) {
    workerRef.current = new Worker(
      new URL('./batchWorker.ts', import.meta.url),
      { type: 'module' },
    )
    apiRef.current = wrap<BatchWorkerApi>(workerRef.current)
  }

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  return apiRef.current!
}
