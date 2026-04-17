import { spawnSync } from 'node:child_process'

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

function hasCommand(command) {
  const probe = process.platform === 'win32' ? 'where' : 'command'
  const args = process.platform === 'win32' ? [command] : ['-v', command]
  const result = spawnSync(probe, args, {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  return result.status === 0
}

if (!hasCommand('cargo')) {
  console.warn('[desktop build] cargo was not found; skipping Tauri bundling. Install Rust/Cargo to produce desktop artifacts.')
  process.exit(0)
}

process.exit(run('pnpm', ['build:bundle'], { cwd: new URL('../apps/desktop/', import.meta.url) }))
