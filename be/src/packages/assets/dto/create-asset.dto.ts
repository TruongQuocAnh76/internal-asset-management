import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { DepreciationMethod } from '@prisma/client';

export class CreateAssetDto {
  @ApiProperty({
    description: 'Name of the asset',
    example: 'Dell XPS 13 Laptop',
  })
  name: string;

  @ApiProperty({
    description: 'Category name of the asset',
    example: 'Laptop',
  })
  category_name: string;

  @ApiProperty({
    description: 'Location name of the asset',
    example: 'Head Office',
  })
  location_name: string;

  @ApiProperty({
    description: 'Cost of the asset',
    example: 1000,
  })
  costs: number;

  @ApiProperty({
    description: 'Specifications of the asset',
    example: { RAM: '16GB', Storage: '512GB SSD' },
  })
  image_num: number;

  @ApiProperty({
    description: 'Initial quantity of individual asset items to create',
    example: 10,
  })
  initial_quantity: number;

  @ApiProperty({
    description: 'Specifications of the asset',
    example: { RAM: '16GB', Storage: '512GB SSD' },
  })
  specs?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Salvage value of the asset',
    example: 500,
  })
  salvage_value?: number;

  @ApiPropertyOptional({
    description: 'Useful life in months',
    example: 60,
  })
  life_months?: number;

  @ApiPropertyOptional({
    description: 'Decline balance rate as percentage (e.g. 20 for 20%)',
    example: 20,
  })
  decline_balance_rate?: number;

  @ApiPropertyOptional({
    description: 'Depreciation method',
    enum: DepreciationMethod,
  })
  depreciation_method?: DepreciationMethod;
}

export const CreateAssetDtoSchema = z.object({
  name: z.string(),
  category_name: z.string(),
  location_name: z.string(),
  costs: z.number().optional().default(0),
  image_num: z.number().optional().default(0),
  initial_quantity: z.number().int().min(1).optional().default(1),
  specs: z.record(z.string(), z.any()).optional(),
  salvage_value: z.number().int().min(0).optional().nullable(),
  life_months: z.number().int().min(1).optional().nullable(),
  decline_balance_rate: z.number().int().min(0).max(100).optional().nullable(),
  depreciation_method: z.nativeEnum(DepreciationMethod).optional().nullable(),
});
