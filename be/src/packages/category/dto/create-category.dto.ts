import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Laptops',
  })
  name: string;
}

export const CreateCategoryDtoSchema = {
  name: 'string',
};
