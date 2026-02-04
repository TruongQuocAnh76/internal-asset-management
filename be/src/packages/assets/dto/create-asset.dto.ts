import { z } from 'zod';

export class CreateAssetDto {
  name: string;
  category_name: string;
  location_name: string;
  costs: number;
  specs?: Record<string, any>;
}

export const CreateAssetDtoSchema = z.object({
  name: z.string(),
  category_name: z.string(),
  location_name: z.string(),
  costs: z.number().optional().default(0),
  specs: z.record(z.string(), z.any()).optional(),
});
