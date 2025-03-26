import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Data transfer object for creating a new user
 */
export class CreateUserDto {
  /**
   * User's email address - must be unique
   * @example "user@example.com"
   */
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Email must be valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  /**
   * User's password - minimum 8 characters
   * @example "password123"
   */
  @ApiProperty({ example: 'password123', description: 'User password (min 8 characters)' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  /**
   * User's first name
   * @example "John"
   */
  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  /**
   * User's last name
   * @example "Doe"
   */
  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  /**
   * User's phone number (optional)
   * @example "+1234567890"
   */
  @ApiPropertyOptional({ example: '+1234567890', description: 'User phone number' })
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;

  /**
   * User's role
   * @example "THERAPIST"
   */
  @ApiProperty({ 
    example: 'THERAPIST', 
    description: 'User role',
    enum: ['ADMIN', 'THERAPIST', 'STAFF'],
    default: 'THERAPIST'
  })
  @IsEnum(['ADMIN', 'THERAPIST', 'STAFF'], { message: 'Role must be valid' })
  @IsOptional()
  role?: string = 'THERAPIST';
}
