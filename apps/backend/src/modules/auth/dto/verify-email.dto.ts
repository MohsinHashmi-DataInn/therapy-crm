import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data transfer object for email verification
 */
export class VerifyEmailDto {
  /**
   * Verification token received via email
   */
  @ApiProperty({ description: 'Verification token received via email' })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  token!: string;
}
