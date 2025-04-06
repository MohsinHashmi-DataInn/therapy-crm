import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

/**
 * Data transfer object for resetting password
 */
export class ResetPasswordDto {
  /**
   * Reset token received via email
   */
  @ApiProperty({ description: 'Reset token received via email' })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  token!: string;

  /**
   * New password - minimum 8 characters
   * @example "newPassword123"
   */
  @ApiProperty({ 
    example: 'newPassword123', 
    description: 'New password - min 8 characters, must include uppercase, lowercase, and numbers' 
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  /**
   * Confirm password - must match new password
   * @example "newPassword123"
   */
  @ApiProperty({ example: 'newPassword123', description: 'Confirm new password' })
  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword!: string;
}
