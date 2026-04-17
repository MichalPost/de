import type { PlatformOps } from '@chemtools/shared/lib/platformOps'
import { copyBarcodeAsPng } from '@chemtools/shared/lib/copyImage'
import { downloadBarcodePng, openBarcodePrintView } from '@chemtools/shared/lib/barcode'
import { downloadBlob } from '@chemtools/shared/lib/utils'

export const webPlatformOps: PlatformOps = {
  copyBarcodeAsPng,
  downloadBarcodePng: (ascii, filename) => downloadBarcodePng(ascii, filename),
  openBarcodePrintView: (ascii, title) => { openBarcodePrintView(ascii, title); return Promise.resolve() },
  exportJsonFile: (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, filename)
    return Promise.resolve()
  },
  readFileAsBlob: (file) => Promise.resolve(file),
}
