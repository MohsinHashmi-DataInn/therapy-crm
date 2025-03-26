import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for user login
 */
export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string = '';

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string = '';
}
