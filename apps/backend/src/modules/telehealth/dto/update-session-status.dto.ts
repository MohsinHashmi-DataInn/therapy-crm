import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum for virtual session statuses
 */
export enum VirtualSessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

/**
 * Data transfer object for updating a virtual session status
 */
export class UpdateSessionStatusDto {
  @ApiProperty({ 
    description: 'New status for the virtual session',
    enum: VirtualSessionStatus,
    example: VirtualSessionStatus.IN_PROGRESS
  })
  @IsNotEmpty()
  @IsEnum(VirtualSessionStatus)
  status!: VirtualSessionStatus;
}
