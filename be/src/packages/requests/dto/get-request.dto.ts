import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getRequestsDtoSchema = z.object({
  status: z
    .enum(['PENDING', 'APPROVED', 'REJECTED', 'PROVIDED', 'OVERDUE', 'CANCELED', 'RETURNED'])
    .optional(),
  requesterId: z.string().optional(),
  assetId: z.string().optional(),
  kitId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  search: z.string().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: 'Page must be a positive integer' })
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' })
    .optional(),
  order: z.enum(['asc', 'desc']).optional(),
  orderBy: z
    .enum(['status', 'requesterId', 'priority', 'requested_at', 'due_date'])
    .optional(),
});

export class GetRequestsDto extends createZodDto(getRequestsDtoSchema) {
  @ApiPropertyOptional({ description: 'Filter by borrow status', example: 'PENDING' })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROVIDED' | 'OVERDUE' | 'CANCELED' | 'RETURNED';

  @ApiPropertyOptional({ description: 'Filter by requester UUID', example: 'uuid' })
  requesterId?: string;

  @ApiPropertyOptional({ description: 'Filter by asset UUID', example: 'uuid' })
  assetId?: string;

  @ApiPropertyOptional({ description: 'Filter by kit UUID', example: 'uuid' })
  kitId?: string;

  @ApiPropertyOptional({ description: 'Filter by borrow priority', example: 'HIGH' })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional({ description: 'Search by asset/kit name or reason', example: 'laptop' })
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10 })
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort direction', example: 'desc' })
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'requested_at' })
  orderBy?: 'status' | 'requesterId' | 'priority' | 'requested_at' | 'due_date';
}
