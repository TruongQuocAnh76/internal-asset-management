import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { RequestPriority } from '../../../core/enums/request-priority.enum';

const createRequestSchema = z.object({
  assetId: z.string().uuid(),
  requesterId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  priority: z.enum(RequestPriority),
});

export class CreateRequestDto extends createZodDto(createRequestSchema) {
  @ApiProperty({
    description: 'ID of the asset being requested',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
    format: 'uuid',
  })
  assetId: string;

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
}
