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
      // migrate old manual-save data (key: reagent_templates)
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // ensure activeId is valid after rehydration
        if (!state.templates.find((t) => t.id === state.activeId)) {
          state.activeId = state.templates[0]?.id ?? ''
        }
      },
    },
  ),
)
