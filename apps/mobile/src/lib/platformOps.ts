import type { PlatformOps } from '@chemtools/shared/lib/platformOps'
import {
  copyBarcodeAsPng,
  downloadBarcodePng,
  openBarcodePrintView,
  exportJsonFile,
} from './capacitorUtils'

export const mobilePlatformOps: PlatformOps = {
  copyBarcodeAsPng,
  downloadBarcodePng,
  openBarcodePrintView,
  exportJsonFile,
  readFileAsBlob: async (file) => {
    // Android revokes File permissions after the first await, so read immediately
    return new Blob([await file.arrayBuffer()], { type: file.type || 'image/jpeg' })
  },
}
