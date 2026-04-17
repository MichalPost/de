import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  })

  if (result.error) {
    throw result.error
  }

  return result.status ?? 1
}

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

function canRunCargo() {
  for (const entry of cargoPathEntries()) {
    const cargoExecutable = join(entry, process.platform === 'win32' ? 'cargo.exe' : 'cargo')
    if (!existsSync(cargoExecutable)) {
      continue
    }

    const env = { ...process.env, PATH: [entry, process.env.PATH ?? ''].filter(Boolean).join(delimiter) }
    const result = spawnSync(cargoExecutable, ['--version'], {
      stdio: 'ignore',
      shell: false,
      env,
    })

    if (result.status === 0) {
      return true
    }
  }

  return false
}

if (!canRunCargo()) {
  console.warn('[desktop build] cargo was not found; skipping Tauri bundling. Install Rust/Cargo to produce desktop artifacts.')
  process.exit(0)
}

process.exit(run('pnpm', ['build:bundle'], { cwd: new URL('../apps/desktop/', import.meta.url) }))
