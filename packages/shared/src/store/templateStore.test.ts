import { describe, it, expect } from 'vitest'
import { createTemplate, getDefaultTemplateDefinition } from '../features/batch/templateStore'

describe('templateStore — pure functions', () => {
  it('getDefaultTemplateDefinition returns a valid template', () => {
    const t = getDefaultTemplateDefinition()
    expect(t.id).toBe('default')
    expect(typeof t.name).toBe('string')
    expect(t.reagentId).toBeGreaterThanOrEqual(0)
    expect(t.controlCode).toBeLessThanOrEqual(15)
  })

  it('createTemplate generates a unique id each call', () => {
    const base = getDefaultTemplateDefinition()
    const t1 = createTemplate(base)
    const t2 = createTemplate(base)
    expect(t1.id).not.toBe(t2.id)
  })

  it('createTemplate sets updatedAt to current time', () => {
    const before = Date.now()
    const t = createTemplate(getDefaultTemplateDefinition())
    const after = Date.now()
    expect(t.updatedAt).toBeGreaterThanOrEqual(before)
    expect(t.updatedAt).toBeLessThanOrEqual(after)
  })

  it('createTemplate preserves all business fields', () => {
    const base = getDefaultTemplateDefinition()
    const t = createTemplate({ ...base, name: '自定义', reagentId: 99 })
    expect(t.name).toBe('自定义')
    expect(t.reagentId).toBe(99)
    expect(t.id).not.toBe(base.id)
  })
})
