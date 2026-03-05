import { ApiPropertyOptional } from '@nestjs/swagger';
import z from 'zod';

export class EditAssetItemDto {
  @ApiPropertyOptional({
    description: 'Location of the asset item',
    example: 'Warehouse - Shelf A2',
  })
  location_name?: string;

  @ApiPropertyOptional({
    description: 'Cost of the asset item',
    example: 1200,
  })
  costs?: number;
}

export const EditAssetItemDtoSchema = z
  .object({
    location_name: z.string().min(1).optional(),
    costs: z.number().min(0).optional(),
  })
  .refine((data) => data.location_name !== undefined || data.costs !== undefined, {
    message: 'At least one field must be provided',
  });
