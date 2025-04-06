import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsBoolean, 
  IsDateString, 
  IsEnum, 
  IsInt, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  Max, 
  Min, 
  ValidateIf, 
  ValidateNested 
} from 'class-validator';
import { AppointmentStatus } from '../../../types/prisma-models';
import { CreateRecurrencePatternDto } from './create-recurrence-pattern.dto';

// Define enums locally until they're available in Prisma client
export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

export enum TherapistRole {
  PRIMARY = 'PRIMARY',
  ASSISTANT = 'ASSISTANT',
  SUPERVISOR = 'SUPERVISOR',
  OBSERVER = 'OBSERVER'
}

// Define enums locally to match schema
export enum AppointmentType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
  ASSESSMENT = 'ASSESSMENT',
  CONSULTATION = 'CONSULTATION',
  ABA_THERAPY = 'ABA_THERAPY',
  SPEECH_THERAPY = 'SPEECH_THERAPY',
  OCCUPATIONAL_THERAPY = 'OCCUPATIONAL_THERAPY'
}

/**
 * DTO for staff assignment within an appointment
 */
export class AppointmentStaffDto {
  @ApiProperty({ example: '1', description: 'ID of the staff member' })
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @ApiProperty({ 
    enum: TherapistRole,
    example: TherapistRole.PRIMARY,
    description: 'Role of the staff member in this appointment'
  })
  @IsEnum(TherapistRole)
  @IsNotEmpty({ message: 'Role is required' })
  role!: TherapistRole;
}

/**
 * DTO for equipment assignment within an appointment
 */
export class AppointmentEquipmentDto {
  @ApiProperty({ example: '1', description: 'ID of the equipment' })
  @IsString()
  @IsNotEmpty({ message: 'Equipment ID is required' })
  equipmentId!: string;

  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Quantity of this equipment needed',
    default: 1
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;

  @ApiPropertyOptional({ 
    example: 'Size medium needed', 
    description: 'Notes about equipment usage' 
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for group session participants
 */
export class GroupParticipantDto {
  @ApiProperty({ example: '1', description: 'ID of the learner participant' })
  @IsString()
  @IsNotEmpty({ message: 'Learner ID is required' })
  learnerId!: string;

  @ApiPropertyOptional({ 
    example: 'Needs visual supports', 
    description: 'Notes specific to this participant' 
  })
  @IsString()
  @IsOptional()
  notes?: string;
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
    example: AppointmentType.ABA_THERAPY,
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

  @ApiProperty({ example: 'ABA Therapy Session', description: 'Appointment title' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @ApiPropertyOptional({ example: 'Focus on communication skills', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '1', description: 'ID of the client' })
  @IsString()
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId!: string;

  @ApiPropertyOptional({ 
    example: '1', 
    description: 'ID of the primary learner (for individual sessions)'
  })
  @IsString()
  @ValidateIf(o => !o.isGroupSession)
  @IsOptional()
  learnerId?: string;

  @ApiProperty({ 
    example: '1', 
    description: 'ID of the primary therapist'
  })
  @IsString()
  @IsNotEmpty({ message: 'Therapist ID is required' })
  therapistId!: string;
  
  @ApiPropertyOptional({
    example: 'Room 2A',
    description: 'Location for the appointment (if not using a therapy room)'
  })
  @IsString()
  @IsOptional()
  location?: string;
  
  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a recurring appointment',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean = false;
  
  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a group session',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isGroupSession?: boolean = false;
  
  @ApiPropertyOptional({
    example: 6,
    description: 'Maximum number of participants for group sessions'
  })
  @IsInt()
  @Min(2)
  @Max(20)
  @ValidateIf(o => o.isGroupSession === true)
  @IsOptional()
  maxParticipants?: number;
  
  @ApiPropertyOptional({
    description: 'ID of the therapy room to use'
  })
  @IsString()
  @IsOptional()
  roomId?: string;
  
  @ApiPropertyOptional({
    type: [AppointmentStaffDto],
    description: 'Additional staff assignments beyond the primary therapist'
  })
  @ValidateNested({ each: true })
  @Type(() => AppointmentStaffDto)
  @IsArray()
  @IsOptional()
  staffAssignments?: AppointmentStaffDto[];
  
  @ApiPropertyOptional({
    type: [AppointmentEquipmentDto],
    description: 'Equipment needed for this appointment'
  })
  @ValidateNested({ each: true })
  @Type(() => AppointmentEquipmentDto)
  @IsArray()
  @IsOptional()
  equipmentAssignments?: AppointmentEquipmentDto[];
  
  @ApiPropertyOptional({
    type: [GroupParticipantDto],
    description: 'Participants for group sessions'
  })
  @ValidateNested({ each: true })
  @Type(() => GroupParticipantDto)
  @IsArray()
  @ValidateIf(o => o.isGroupSession === true)
  @IsOptional()
  groupParticipants?: GroupParticipantDto[];
  
  @ApiPropertyOptional({
    type: CreateRecurrencePatternDto,
    description: 'Recurrence pattern for recurring appointments'
  })
  @ValidateNested()
  @Type(() => CreateRecurrencePatternDto)
  @ValidateIf(o => o.isRecurring === true)
  @IsOptional()
  recurrencePattern?: CreateRecurrencePatternDto;
}
