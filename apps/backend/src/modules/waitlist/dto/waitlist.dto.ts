import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { WaitlistPriority, WaitlistStatus } from '@prisma/client';

export class CreateWaitlistEntryDto {
  @ApiProperty({ description: 'ID of the client for this waitlist entry' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ 
    description: 'Priority level of the waitlist entry', 
    enum: WaitlistPriority, 
    default: WaitlistPriority.MEDIUM 
  })
  @IsEnum(WaitlistPriority)
  @IsOptional()
  priority?: WaitlistPriority;

  @ApiPropertyOptional({ description: 'Requested service or program' })
  @IsString()
  @IsOptional()
  requestedService?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the waitlist entry' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Current status of the waitlist entry', 
    enum: WaitlistStatus, 
    default: WaitlistStatus.WAITING 
  })
  @IsEnum(WaitlistStatus)
  @IsOptional()
  status?: WaitlistStatus;

  @ApiPropertyOptional({ description: 'Date for next follow-up' })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}

export class UpdateWaitlistEntryDto {
  @ApiPropertyOptional({ description: 'Priority level of the waitlist entry', enum: WaitlistPriority })
  @IsEnum(WaitlistPriority)
  @IsOptional()
  priority?: WaitlistPriority;

  @ApiPropertyOptional({ description: 'Requested service or program' })
  @IsString()
  @IsOptional()
  requestedService?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the waitlist entry' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Current status of the waitlist entry', enum: WaitlistStatus })
  @IsEnum(WaitlistStatus)
  @IsOptional()
  status?: WaitlistStatus;

  @ApiPropertyOptional({ description: 'Date for next follow-up' })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @ApiPropertyOptional({ description: 'ID of the client for this waitlist entry' })
  @IsUUID()
  @IsOptional()
  clientId?: string;
}
