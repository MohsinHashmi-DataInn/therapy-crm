import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Define enums locally to match those in the service and Prisma schema
export enum ServiceType {
  SPEECH_THERAPY = 'SPEECH_THERAPY',
  OCCUPATIONAL_THERAPY = 'OCCUPATIONAL_THERAPY',
  PHYSICAL_THERAPY = 'PHYSICAL_THERAPY',
  BEHAVIORAL_THERAPY = 'BEHAVIORAL_THERAPY'
}

export enum WaitlistStatus {
  WAITING = 'WAITING',
  CONTACTED = 'CONTACTED',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED'
}

/**
 * Data transfer object for creating waitlist entries
 */
export class CreateWaitlistDto {
  /**
   * Type of service requested
   * @example "SPEECH_THERAPY"
   */
  @ApiProperty({
    description: 'Type of service requested',
    enum: ServiceType,
    example: ServiceType.SPEECH_THERAPY,
  })
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType!: ServiceType;

  /**
   * Date when service was requested (default: current date)
   * @example "2025-03-25T12:00:00Z"
   */
  @ApiProperty({
    description: 'Date when service was requested',
    example: '2025-03-25T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  requestDate?: string;

  /**
   * Status of waitlist entry (default: WAITING)
   * @example "WAITING"
   */
  @ApiProperty({
    description: 'Status of waitlist entry',
    enum: WaitlistStatus,
    example: WaitlistStatus.WAITING,
    required: false,
    default: WaitlistStatus.WAITING,
  })
  @IsEnum(WaitlistStatus)
  @IsOptional()
  status?: WaitlistStatus = WaitlistStatus.WAITING;

  /**
   * ID of client for waitlist entry
   * @example "1"
   */
  @ApiProperty({
    description: 'ID of client for waitlist entry',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  /**
   * Preferred schedule or time
   * @example "Prefers afternoons"
   */
  @ApiPropertyOptional({
    example: 'Prefers afternoons',
    description: 'Preferred schedule or time'
  })
  @IsString()
  @IsOptional()
  preferredSchedule?: string;

  /**
   * Additional notes
   * @example "Needs urgent assistance with speech"
   */
  @ApiPropertyOptional({
    example: 'Needs urgent assistance with speech',
    description: 'Additional notes'
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
