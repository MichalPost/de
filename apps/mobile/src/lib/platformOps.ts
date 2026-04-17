import type { PlatformOps } from '@chemtools/shared/lib/platformOps'
import {
  copyBarcodeAsPng,
  downloadBarcodePng,
  openBarcodePrintView,
  exportJsonFile,
} from './capacitorUtils'
import {
  exportResultsAsPng,
  copyResultsAsImage,
  exportResultsAsPdf,
  MAX_PAGES_PER_PNG,
} from '../features/batch/exportBatch'

export const mobilePlatformOps: PlatformOps = {
  copyBarcodeAsPng,
  downloadBarcodePng,
  openBarcodePrintView,
  exportJsonFile,
  readFileAsBlob: async (file) => {
    return new Blob([await file.arrayBuffer()], { type: file.type || 'image/jpeg' })
  },
  exportBatchAsPng: exportResultsAsPng,
  copyBatchAsImage: copyResultsAsImage,
  exportBatchAsPdf: exportResultsAsPdf,
  maxPagesPerPng: MAX_PAGES_PER_PNG,
}
