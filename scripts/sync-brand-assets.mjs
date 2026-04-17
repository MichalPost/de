import { copyFile, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const sharedDir = path.join(rootDir, 'assets', 'brand')
const sharedPublicDir = path.join(sharedDir, 'public')

const targets = {
  web: path.join(rootDir, 'apps', 'web', 'public'),
  mobile: path.join(rootDir, 'apps', 'mobile', 'public'),
}

const files = ['favicon.svg', 'icons.svg']

async function ensureExists(filePath) {
  await access(filePath)
}

async function syncTarget(targetName) {
  const targetDir = targets[targetName]
  if (!targetDir) {
    throw new Error(`Unknown target "${targetName}". Expected one of: ${Object.keys(targets).join(', ')}`)
  }

  await mkdir(targetDir, { recursive: true })

  for (const file of files) {
    const source = path.join(sharedPublicDir, file)
    const destination = path.join(targetDir, file)
    await ensureExists(source)
    await copyFile(source, destination)
  }

  console.log(`Synced brand assets to ${targetName}`)
}

const requestedTargets = process.argv.slice(2)
const targetNames = requestedTargets.length > 0 ? requestedTargets : Object.keys(targets)

for (const targetName of targetNames) {
  await syncTarget(targetName)
}
