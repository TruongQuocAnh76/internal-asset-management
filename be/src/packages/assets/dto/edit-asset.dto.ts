import z from 'zod';

export class EditAssetDto {
  name?: string;
  category_name: string;
  status?: 'READY' | 'IN_USE' | 'MAINTAINANCE' | 'BROKEN' | 'LIQUIDATED';
  costs?: number;
  specs?: Record<string, any>;
}

export const EditAssetDtoSchema = z.object({
  name: z.string().optional(),
  category_name: z.string(),
  status: z
    .enum(['READY', 'IN_USE', 'MAINTAINANCE', 'BROKEN', 'LIQUIDATED'])
    .optional(),
  costs: z.number().optional(),
  specs: z.record(z.string(), z.any()).optional(),
});
