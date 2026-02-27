import { z } from 'zod';

export const SetMaintenanceDtoSchema = z.object({
  asset_item_id: z.string().uuid(),
  maintenance_notes: z.string().min(1).max(1000),
});

export type SetMaintenanceDto = z.infer<typeof SetMaintenanceDtoSchema>;

export const ResolveMaintenanceDtoSchema = z.object({
  asset_item_id: z.string().uuid(),
  resolved_status: z.enum(['READY', 'BROKEN', 'LIQUIDATED']),
  repair_cost: z.number().int().min(0).optional().default(0),
  description: z.string().max(1000).optional(),
});

export type ResolveMaintenanceDto = z.infer<typeof ResolveMaintenanceDtoSchema>;
