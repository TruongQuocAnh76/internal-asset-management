import { z } from 'zod';

enum AssetStatus {
  READY = 'READY',
  IN_USE = 'IN_USE',
  MAINTAINANCE = 'MAINTAINANCE',
  BROKEN = 'BROKEN',
  LIQUIDATED = 'LIQUIDATED',
}

export const StatusSchema = z.enum([
  AssetStatus.READY,
  AssetStatus.IN_USE,
  AssetStatus.MAINTAINANCE,
  AssetStatus.BROKEN,
  AssetStatus.LIQUIDATED,
]);
export type AssetStatusType = z.infer<typeof StatusSchema>;
