import { useBatchWorker as _useBatchWorker } from '@chemtools/shared/features/batch/useBatchWorker'
export type { BatchWorkerApi } from '@chemtools/shared/features/batch/useBatchWorker'

const WORKER_URL = new URL('./batchWorker.ts', import.meta.url)

export function useBatchWorker() {
  return _useBatchWorker(WORKER_URL)
}
