import { ApiPropertyOptional } from '@nestjs/swagger';
import z from 'zod';

export class GetKitsParams {
  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'status',
  })
  filter?: 'status';

  @ApiPropertyOptional({
    description: 'Value to filter by',
    example: 'READY',
  })
  filterValue?: string;

  @ApiPropertyOptional({
    description: 'Search term for kit name',
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
    example: 'name',
  })
  orderBy?: 'name' | 'createdAt' | 'updatedAt';

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

export const getKitsParamsSchema = z.object({
  search: z.string().optional(),
  filter: z.enum(['status']).optional(),
  filterValue: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  orderBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
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
