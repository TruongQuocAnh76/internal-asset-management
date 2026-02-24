import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import z from 'zod';

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
