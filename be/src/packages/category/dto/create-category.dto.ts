import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { DepreciationMethod } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Laptops',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Default salvage value for assets in this category',
    example: 500,
  })
  salvage_value?: number;

  @ApiPropertyOptional({
    description: 'Default useful life in months',
    example: 60,
  })
  default_life_months?: number;

  @ApiPropertyOptional({
    description: 'Decline balance rate as percentage (e.g. 20 for 20%)',
    example: 20,
  })
  decline_balance_rate?: number;

  @ApiPropertyOptional({
    description: 'Default depreciation method',
    enum: DepreciationMethod,
  })
  default_depreciation_method?: DepreciationMethod;
}

export const CreateCategoryDtoSchema = z.object({
  name: z.string(),
  salvage_value: z.number().int().min(0).optional().nullable(),
  default_life_months: z.number().int().min(1).optional().nullable(),
  decline_balance_rate: z.number().int().min(0).max(100).optional().nullable(),
  default_depreciation_method: z.nativeEnum(DepreciationMethod).optional().nullable(),
});
