import { BatchPage as SharedBatchPage } from '@chemtools/shared/pages/BatchPage'
import { useBatchWorker } from '../features/batch/useBatchWorker'

export function BatchPage() {
  const worker = useBatchWorker()
  return <SharedBatchPage worker={worker} />
}
