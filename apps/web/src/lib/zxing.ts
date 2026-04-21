import { prepareZXingModule } from 'zxing-wasm/reader'

let configured = false

export function configureZXingWasm() {
  if (configured || typeof window === 'undefined') return
  configured = true

  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => {
        if (path.endsWith('.wasm')) {
          return new URL('./zxing-wasm/zxing_reader.wasm', window.location.href).toString()
        }
        return prefix + path
      },
    },
  })
}
