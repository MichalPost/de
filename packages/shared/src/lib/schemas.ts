import { z } from 'zod'

export const reagentFormSchema = z.object({
  reagentId:         z.coerce.number().int().min(0).max(255),
  manufactureYear:   z.string().regex(/^\d{1,2}$/, '2位年份').transform(v => v.padStart(2, '0')),
  manufactureMonth:  z.string().regex(/^(0?[1-9]|1[0-2])$/, '1-12'),
  manufactureDay:    z.string().regex(/^(0?[1-9]|[12]\d|3[01])$/, '1-31'),
  storageHalfMonths: z.coerce.number().int().min(0).max(255),
  openHalfMonths:    z.coerce.number().int().min(0).max(255),
  validUses:         z.coerce.number().int().min(0).max(65535),
  lotNumber:         z.coerce.number().int().min(0).max(65535),
  serialNumber:      z.coerce.number().int().min(0).max(65535),
  agentId:           z.coerce.number().int().min(0).max(65535),
  customerId:        z.coerce.number().int().min(0).max(65535),
  controlCode:       z.coerce.number().int().min(0).max(15),
})

export type ReagentFormValues = z.infer<typeof reagentFormSchema>
