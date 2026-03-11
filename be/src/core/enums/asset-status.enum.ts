import { ItemStatus } from '@prisma/client';
import { z } from 'zod';

export const StatusSchema = z.enum([
  ItemStatus.READY,
  ItemStatus.IN_USE,
  ItemStatus.MAINTAINANCE,
  ItemStatus.BROKEN,
  ItemStatus.LIQUIDATED,
]);
export type AssetStatusType = z.infer<typeof StatusSchema>;

export { ItemStatus };
