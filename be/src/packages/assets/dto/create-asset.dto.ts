import { z } from 'zod';

export class CreateAssetDto {
  name: string;
  category_name: string;
  location_name: string;
  costs: number;
  image_num: number;
  stock: number;
  specs?: Record<string, any>;
}

export const CreateAssetDtoSchema = z.object({
  name: z.string(),
  category_name: z.string(),
  location_name: z.string(),
  costs: z.number().optional().default(0),
  image_num: z.number().optional().default(0),
  stock: z.number().optional().default(1),
  specs: z.record(z.string(), z.any()).optional(),
});
