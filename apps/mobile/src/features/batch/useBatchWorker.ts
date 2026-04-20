import { useBatchWorker as _useBatchWorker } from '@chemtools/shared/features/batch/useBatchWorker'
export type { BatchWorkerApi } from '@chemtools/shared/features/batch/useBatchWorker'

// Worker URL must be declared in the app layer so Vite can statically analyse
// the new URL() expression and correctly bundle the worker file.
const WORKER_URL = new URL(
  '../../../../../../packages/shared/src/features/batch/batchWorker.ts',
  import.meta.url,
)

export function useBatchWorker() {
  return _useBatchWorker(WORKER_URL)
}
