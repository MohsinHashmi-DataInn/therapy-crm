import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsDateString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsJSON,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for creating a virtual telehealth session
 */
export class CreateVirtualSessionDto {
  @ApiProperty({ description: 'Title of the virtual session' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Description of the virtual session' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Scheduled start time', example: '2023-05-15T14:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  scheduled_start!: string;

  @ApiProperty({ description: 'Scheduled end time', example: '2023-05-15T15:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  scheduled_end!: string;

  @ApiPropertyOptional({ 
    description: 'Session status',
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'SCHEDULED'
  })
  @IsOptional()
  @IsEnum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
  status?: string;

  @ApiPropertyOptional({ description: 'Access code for the session' })
  @IsOptional()
  @IsString()
  access_code?: string;

  @ApiProperty({ description: 'ID of the telehealth provider to use' })
  @IsNotEmpty()
  @IsString()
  provider_id!: string;

  @ApiPropertyOptional({ description: 'ID of the therapist conducting the session' })
  @IsOptional()
  @IsString()
  therapist_id?: string;

  @ApiPropertyOptional({ description: 'ID of the client for the session' })
  @IsOptional()
  @IsString()
  client_id?: string;
  
  @ApiPropertyOptional({ description: 'ID of the appointment this session is attached to' })
  @IsOptional()
  @IsString()
  appointmentId?: string;
  
  @ApiProperty({ description: 'Scheduled start time (alternative format)', example: '2023-05-15T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledStartTime?: string;
  
  @ApiPropertyOptional({ description: 'Duration of the session in minutes' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes?: number;
  
  @ApiPropertyOptional({ description: 'Whether waiting room is enabled' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  waitingRoomEnabled?: boolean;
  
  @ApiPropertyOptional({ description: 'Whether session recording is enabled' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  recordingEnabled?: boolean;
  
  @ApiPropertyOptional({ description: 'Additional provider-specific settings as JSON' })
  @IsOptional()
  @IsJSON()
  providerSettings?: Record<string, any>;
  
  @ApiPropertyOptional({ description: 'Additional participant emails' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalParticipants?: string[];

  @ApiPropertyOptional({ description: 'Meeting ID from the telehealth provider' })
  @IsOptional()
  @IsString()
  meeting_id?: string;

  @ApiPropertyOptional({ description: 'Meeting URL for participants' })
  @IsOptional()
  @IsString()
  meeting_url?: string;

  @ApiPropertyOptional({ description: 'Host URL for the therapist' })
  @IsOptional()
  @IsString()
  host_url?: string;
}
