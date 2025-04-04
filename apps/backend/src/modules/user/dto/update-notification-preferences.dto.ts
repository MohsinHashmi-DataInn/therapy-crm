import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for updating notification preferences.
 * All fields are optional as the user might only update specific preferences.
 */
export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Enable or disable email notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable SMS notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable push notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;
}
