import { ApiPropertyOptional } from '@nestjs/swagger';
import z from 'zod';

export class GetAssetsParams {
  @ApiPropertyOptional({
    description:
      'Filter by requesterId category, status, costs, or acquired_at',
    example: 'category',
  })
  filter?: 'requesterId' | 'category' | 'status' | 'costs' | 'acquired_at';

  @ApiPropertyOptional({
    description: 'Value to filter by',
    example: 'Electronics',
  })
  filterValue?: string;

  @ApiPropertyOptional({
    description: 'Search term for asset name or code',
    example: 'Laptop',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Order of results',
    example: 'asc',
  })
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Field to order results by',
    example: 'category',
  })
  orderBy?: 'category' | 'status' | 'costs' | 'acquired_at';

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
  })
  limit?: number;
}

export const getAssetsParamsSchema = z.object({
  search: z.string().optional(),
  filter: z
    .enum(['requesterId', 'category', 'status', 'costs', 'acquired_at'])
    .optional(),
  filterValue: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  orderBy: z.enum(['category', 'status', 'costs', 'acquired_at']).optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Page must be a positive integer',
    })
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Limit must be a positive integer',
    })
    .optional(),
});
