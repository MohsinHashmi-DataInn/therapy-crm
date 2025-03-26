import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

/**
 * Data Transfer Object for updating an existing user
 * Extends CreateUserDto but omits password and makes all fields optional
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiPropertyOptional({
    description: 'User active status',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
