import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import z from 'zod';
import { DepreciationMethod } from '@prisma/client';

export class EditAssetDto {
  @ApiPropertyOptional({
    description: 'Name of the asset',
    example: 'Dell XPS 13 Laptop',
  })
  name?: string;

  @ApiProperty({
    description: 'Category name of the asset',
    example: 'Laptop',
  })
  category_name: string;

  @ApiPropertyOptional({
    description: 'Status of the asset',
    example: 'IN_USE',
    enum: ['READY', 'IN_USE', 'MAINTAINANCE', 'BROKEN', 'LIQUIDATED'],
  })
  status?: 'READY' | 'IN_USE' | 'MAINTAINANCE' | 'BROKEN' | 'LIQUIDATED';

  @ApiPropertyOptional({
    description: 'Cost of the asset',
    example: 1200,
  })
  costs?: number;

  @ApiPropertyOptional({
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
    description: 'Decline balance rate as percentage',
    example: 20,
  })
  decline_balance_rate?: number;

  @ApiPropertyOptional({
    description: 'Depreciation method',
    enum: DepreciationMethod,
  })
  depreciation_method?: DepreciationMethod;
}

export const EditAssetDtoSchema = z.object({
  name: z.string().optional(),
  category_name: z.string(),
  status: z
    .enum(['READY', 'IN_USE', 'MAINTAINANCE', 'BROKEN', 'LIQUIDATED'])
    .optional(),
  costs: z.number().optional(),
  specs: z.record(z.string(), z.any()).optional(),
  salvage_value: z.number().int().min(0).optional().nullable(),
  life_months: z.number().int().min(1).optional().nullable(),
  decline_balance_rate: z.number().int().min(0).max(100).optional().nullable(),
  depreciation_method: z.nativeEnum(DepreciationMethod).optional().nullable(),
});
