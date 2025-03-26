import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Define enums locally to match schema
export enum AppointmentType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
  ASSESSMENT = 'ASSESSMENT',
  CONSULTATION = 'CONSULTATION'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

/**
 * Data Transfer Object for creating a new appointment
 */
export class CreateAppointmentDto {
  @ApiProperty({ example: '2025-04-01T14:00:00Z', description: 'Appointment start time (ISO format)' })
  @IsDateString()
  @IsNotEmpty({ message: 'Start time is required' })
  startTime!: string;

  @ApiProperty({ example: '2025-04-01T15:00:00Z', description: 'Appointment end time (ISO format)' })
  @IsDateString()
  @IsNotEmpty({ message: 'End time is required' })
  endTime!: string;

  @ApiProperty({ 
    enum: AppointmentType, 
    example: AppointmentType.INDIVIDUAL,
    description: 'Type of appointment' 
  })
  @IsEnum(AppointmentType, { message: 'Type must be a valid appointment type' })
  @IsNotEmpty({ message: 'Type is required' })
  type!: AppointmentType;

  @ApiPropertyOptional({ 
    enum: AppointmentStatus, 
    default: AppointmentStatus.SCHEDULED,
    example: AppointmentStatus.SCHEDULED,
    description: 'Appointment status' 
  })
  @IsEnum(AppointmentStatus, { message: 'Status must be a valid appointment status' })
  @IsOptional()
  status?: AppointmentStatus = AppointmentStatus.SCHEDULED;

  @ApiProperty({ example: 'Speech therapy session', description: 'Appointment title' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @ApiPropertyOptional({ example: 'Focus on articulation exercises', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Virtual (Zoom)', description: 'Location of the appointment' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: '1', description: 'ID of the client (if applicable)' })
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ example: '1', description: 'ID of the learner (if applicable)' })
  @IsOptional()
  learnerId?: string;

  @ApiProperty({ example: '1', description: 'ID of the therapist or instructor' })
  @IsNotEmpty({ message: 'Therapist/instructor ID is required' })
  therapistId!: string;
}
