import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class getRequestsDto {
  filter?:
    | 'status'
    | 'requesterId'
    | 'borrowPriority'
    | 'costs'
    | 'acquired_at'
    | 'assetId';
  filterValue?: string;
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  orderBy?:
    | 'status'
    | 'requesterId'
    | 'borrowPriority'
    | 'costs'
    | 'acquired_at'
    | 'assetId';
}

export const getRequestsDtoSchema = z.object({
  filter: z
    .enum([
      'status',
      'requesterId',
      'borrowPriority',
      'costs',
      'acquired_at',
      'assetId',
      'kitId',
    ])
    .optional(),
  filterValue: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  orderBy: z
    .enum([
      'status',
      'requesterId',
      'borrowPriority',
      'costs',
      'acquired_at',
      'assetId',
    ])
    .optional(),
});

export class GetRequestsDto extends createZodDto(getRequestsDtoSchema) {
  @ApiProperty({
    description: 'Filter string for searching requests',
    example: 'urgent',
    required: false,
  })
  filter?:
    | 'status'
    | 'requesterId'
    | 'borrowPriority'
    | 'costs'
    | 'acquired_at'
    | 'assetId'
    | 'kitId';

  @ApiProperty({
    description: 'Value to filter by',
    example: 'Electronics',
    required: false,
  })
  filterValue?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  limit?: number;

  @ApiProperty({
    description: 'Order of results',
    example: 'asc',
    required: false,
  })
  order?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Field to order results by',
    example: 'status',
    required: false,
  })
  orderBy?:
    | 'status'
    | 'requesterId'
    | 'borrowPriority'
    | 'costs'
    | 'acquired_at'
    | 'assetId';
}
