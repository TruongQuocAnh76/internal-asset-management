import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const requestProvideSchema = z
  .object({
    assetId: z.string().uuid().optional(),
    kitId: z.string().uuid().optional(),
  })
  .refine(
    (data) => (data.assetId || data.kitId) && !(data.assetId && data.kitId),
    {
      message: 'Either assetId or kitId must be provided, but not both.',
    },
  );

export class RequestProvideDto extends createZodDto(requestProvideSchema) {
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
}