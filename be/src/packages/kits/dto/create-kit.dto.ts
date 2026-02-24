import { ApiProperty, PartialType } from '@nestjs/swagger';
import z from 'zod';

export class CreateKitDto {
  @ApiProperty({
    description: 'Name of the kit',
    example: 'Photography Kit',
  })
  name: string;
  @ApiProperty({
    description: 'Array of asset IDs included in the kit',
    example: ['asset-id-1', 'asset-id-2'],
  })
  asset_ids: string[];
}

export const CreateKitDtoSchema = z.object({
  name: z.string().min(1, 'Kit name is required'),
  asset_ids: z.array(z.string()).min(1, 'At least one asset ID is required'),
});

export class UpdateKitDto extends PartialType(CreateKitDto) {}

export const UpdateKitDtoSchema = CreateKitDtoSchema.partial();
