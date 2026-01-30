import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

const signupSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  password: z.string().min(6),
  department: z.string().min(1),
});
export class SignupDto extends createZodDto(signupSchema) {
  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
    required: true,
    minLength: 1,
  })
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
    required: true,
  })
  email: string;
  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: true,
    minLength: 1,
  })
  first_name: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: true,
    minLength: 1,
  })
  last_name: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
    required: true,
    minLength: 6,
  })
  password: string;

  @ApiProperty({
    description: 'Department',
    example: 'Engineering',
    required: true,
    minLength: 1,
  })
  department: string;
}

export class SignupResponseDto {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}
