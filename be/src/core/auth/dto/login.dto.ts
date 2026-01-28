import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
const loginSchema = z.object({
  credential: z.string().min(1), // email or username
  password: z.string().min(6),
});
export class LoginDto extends createZodDto(loginSchema) {
  @ApiProperty({
    description: 'Username or email address',
    example: 'john_doe',
    required: true,
    minLength: 1,
  })
  credential: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
    required: true,
    minLength: 6,
  })
  password: string;
}

export class LoginResponseDto {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}
