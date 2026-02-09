import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

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
    description: 'Stock count of the asset',
    example: 10,
  })
  stock: number;

  @ApiProperty({
    description: 'Specifications of the asset',
    example: { RAM: '16GB', Storage: '512GB SSD' },
  })
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
