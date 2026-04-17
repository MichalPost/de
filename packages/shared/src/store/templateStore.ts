import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TemplateDefinition } from '../features/batch/types'
import { createTemplate, getDefaultTemplateDefinition } from '../features/batch/templateStore'

interface TemplateStore {
  templates: TemplateDefinition[]
  activeId: string
  setActiveId: (id: string) => void
  addTemplate: (t: TemplateDefinition) => void
  updateTemplate: (t: TemplateDefinition) => void
  deleteTemplate: (id: string) => void
}

/** Current schema version — bump when TemplateDefinition gains new required fields */
const STORE_VERSION = 1

function migrateTemplate(raw: Partial<TemplateDefinition>): TemplateDefinition {
  const defaults = getDefaultTemplateDefinition()
  return {
    ...defaults,
    ...raw,
    // v1: ensure new fields added in v1 have defaults
    genMode: raw.genMode ?? defaults.genMode,
    genCount: raw.genCount ?? defaults.genCount,
    genIdList: raw.genIdList ?? defaults.genIdList,
    printConfig: raw.printConfig ?? defaults.printConfig,
    serialMode: raw.serialMode ?? defaults.serialMode,
  }
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set) => ({
      templates: [createTemplate(getDefaultTemplateDefinition())],
      activeId: '',

      setActiveId: (id) => set({ activeId: id }),

      addTemplate: (t) => {
        const newT = createTemplate(t)
        set((s) => ({ templates: [...s.templates, newT], activeId: newT.id }))
      },

      updateTemplate: (t) =>
        set((s) => ({
          templates: s.templates.map((x) => (x.id === t.id ? { ...t, updatedAt: Date.now() } : x)),
        })),

      deleteTemplate: (id) =>
        set((s) => {
          if (s.templates.length <= 1) return s
          const templates = s.templates.filter((t) => t.id !== id)
          return { templates, activeId: s.activeId === id ? templates[0].id : s.activeId }
        }),
    }),
    {
      name: 'reagent-templates',
      version: STORE_VERSION,
      migrate: (persisted, version) => {
        const state = persisted as { templates?: Partial<TemplateDefinition>[]; activeId?: string }
        const templates = (state.templates ?? []).map(migrateTemplate)
        if (templates.length === 0) templates.push(createTemplate(getDefaultTemplateDefinition()))
        return { templates, activeId: state.activeId ?? templates[0].id }
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (!state.templates.find((t) => t.id === state.activeId)) {
          state.activeId = state.templates[0]?.id ?? ''
        }
      },
    },
  ),
)
