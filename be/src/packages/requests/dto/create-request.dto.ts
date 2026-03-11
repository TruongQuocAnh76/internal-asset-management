import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { RequestPriority } from '../../../core/enums/request-priority.enum';

const createRequestSchema = z
  .object({
    assetId: z.string().uuid().optional(),
    kitId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    requesterId: z.string().uuid(),
    reason: z.string().min(1).max(500),
    priority: z.enum(RequestPriority),
    dueDate: z.string().date().optional(),
  })
  .refine(
    (data) =>
      (data.assetId || data.kitId || data.categoryId) &&
      !(data.assetId && data.kitId && data.categoryId),
    {
      message:
        'Either assetId or kitId or categoryId must be provided, but not both.',
    },
  );

export class CreateRequestDto extends createZodDto(createRequestSchema) {
  @ApiProperty({
    description: 'ID of the asset being requested',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    format: 'uuid',
  })
  assetId: string;

  @ApiProperty({
    description: 'ID of the kit being requested',
    example: '770e8400-e29b-41d4-a716-446655440000',
    required: false,
    format: 'uuid',
  })
  kitId: string;

  @ApiProperty({
    description: 'ID of the category being requested',
    example: '990e8400-e29b-41d4-a716-446655440000',
    required: false,
    format: 'uuid',
  })
  categoryId: string;

  @ApiProperty({
    description: 'ID of the user making the request',
    example: '660e8400-e29b-41d4-a716-446655440000',
    required: true,
    format: 'uuid',
  })
  requesterId: string;

  @ApiProperty({
    description: 'Reason for the asset request',
    example: 'Need this laptop for project work',
    required: true,
    minLength: 1,
    maxLength: 500,
  })
  reason: string;

  @ApiProperty({
    description: 'Priority level of the request',
    example: 'MEDIUM',
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  priority: RequestPriority;

  @ApiProperty({
    description: 'Due date for returning the borrowed asset',
    example: '2025-07-01',
    required: false,
    format: 'date',
  })
  dueDate: string;
}
