import { ApiPropertyOptional } from '@nestjs/swagger';
import z from 'zod';

export class GetAssetsParams {
  @ApiPropertyOptional({ description: 'Filter by requester ID', example: 'uuid' })
  requesterId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID', example: 'uuid' })
  category_id?: string;

  @ApiPropertyOptional({ description: 'Filter by status', example: 'READY' })
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by acquired date (ISO string)', example: '2024-01-01' })
  acquired_at?: string;

  @ApiPropertyOptional({
    description: 'Search term for asset name or code',
    example: 'Laptop',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs associated with the asset',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  })
  image_urls: string[];

  @ApiPropertyOptional({
    description: 'Order of results',
    example: 'asc',
  })
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Field to order results by',
    example: 'status',
  })
  orderBy?: 'status' | 'costs' | 'acquired_at';

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
  requesterId: z.string().optional(),
  category_id: z.string().optional(),
  status: z.string().optional(),
  acquired_at: z.string().optional(),
  search: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  orderBy: z.enum(['status', 'costs', 'acquired_at']).optional(),
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
