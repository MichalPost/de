import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'

function cargoPathEntries() {
  const entries = new Set()

  for (const home of [process.env.USERPROFILE, process.env.HOME]) {
    if (home) {
      entries.add(join(home, '.cargo', 'bin'))
    }
  }

  if (process.env.PATH) {
    for (const entry of process.env.PATH.split(delimiter)) {
      if (entry) {
        entries.add(entry)
      }
    }
  }

  return [...entries]
}

function tauriToolPathEntries() {
  const entries = []
  const localAppData = process.env.LOCALAPPDATA

  if (localAppData) {
    entries.push(join(localAppData, 'tauri', 'WixTools314'))
    entries.push(join(localAppData, 'tauri', 'NSIS'))
    entries.push(join(localAppData, 'tauri', 'NSIS', 'Bin'))
  }

  return entries.filter((entry) => existsSync(entry))
}

function buildEnv() {
  const preferred = cargoPathEntries().filter((entry) => {
    const cargoExecutable = join(entry, process.platform === 'win32' ? 'cargo.exe' : 'cargo')
    return existsSync(cargoExecutable)
  })

  return {
    ...process.env,
    PATH: [...preferred, ...tauriToolPathEntries(), process.env.PATH ?? ''].filter(Boolean).join(delimiter),
  }
}

const args = process.argv.slice(2)
const command = process.platform === 'win32' ? 'cmd.exe' : 'pnpm'
const commandArgs =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', 'pnpm', 'exec', 'tauri', ...args]
    : ['exec', 'tauri', ...args]
const result = spawnSync(command, commandArgs, {
  stdio: 'inherit',
  shell: false,
  env: buildEnv(),
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
