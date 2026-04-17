import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MIN_PDF_BARCODE_SCALE = 55
export const MAX_PDF_BARCODE_SCALE = 95
export const DEFAULT_PDF_BARCODE_SCALE = 72

interface PdfSettingsStore {
  pdfBarcodeScale: number
  setPdfBarcodeScale: (scale: number) => void
}

function clampScale(scale: number) {
  return Math.min(MAX_PDF_BARCODE_SCALE, Math.max(MIN_PDF_BARCODE_SCALE, Math.round(scale)))
}

export const usePdfSettingsStore = create<PdfSettingsStore>()(
  persist(
    (set) => ({
      pdfBarcodeScale: DEFAULT_PDF_BARCODE_SCALE,
      setPdfBarcodeScale: (pdfBarcodeScale) => set({ pdfBarcodeScale: clampScale(pdfBarcodeScale) }),
    }),
    {
      name: 'reagent-pdf-settings',
    },
  ),
)
