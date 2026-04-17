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

// Worker URL is resolved relative to this file so Vite can statically analyse it
const WORKER_URL = new URL('./batchWorker.ts', import.meta.url)

export function useBatchWorker(): Remote<BatchWorkerApi> {
  const workerRef = useRef<Worker | null>(null)
  const apiRef = useRef<Remote<BatchWorkerApi> | null>(null)

  if (!workerRef.current) {
    workerRef.current = new Worker(WORKER_URL, { type: 'module' })
    apiRef.current = wrap<BatchWorkerApi>(workerRef.current)
  }

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  return apiRef.current!
}
