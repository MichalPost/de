import type { TemplateDefinition } from './types'

const STORAGE_KEY = 'reagent_templates'

function getDefaultTemplate(): TemplateDefinition {
  return {
    id: 'default',
    name: '默认模板（序号范围）',
    reagentId: 75,
    storageHalfMonths: 48,
    openHalfMonths: 4,
    validUses: 1500,
    lotNumber: 1234,
    serialNumber: 1,
    agentId: 589,
    customerId: 3664,
    controlCode: 7,
    serialMode: 'increment',
    genMode: 'serial',
    genCount: 10,
    genIdList: '',
    printConfig: '',
    updatedAt: Date.now(),
  }
}

export function loadTemplates(): TemplateDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as TemplateDefinition[]
      if (parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  const def = getDefaultTemplate()
  saveTemplates([def])
  return [def]
}

export function saveTemplates(templates: TemplateDefinition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function createTemplate(base: Omit<TemplateDefinition, 'id' | 'updatedAt'>): TemplateDefinition {
  return { ...base, id: crypto.randomUUID(), updatedAt: Date.now() }
}

export function getDefaultTemplateDefinition(): TemplateDefinition {
  return getDefaultTemplate()
}
