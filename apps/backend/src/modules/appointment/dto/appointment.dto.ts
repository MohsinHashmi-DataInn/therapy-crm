import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Appointment title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Start time of the appointment' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time of the appointment' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Appointment status', enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Additional notes about the appointment' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Location of the appointment' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Whether a reminder has been sent' })
  @IsBoolean()
  @IsOptional()
  reminderSent?: boolean;

  @ApiProperty({ description: 'ID of the client associated with this appointment' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ description: 'ID of the learner associated with this appointment' })
  @IsUUID()
  @IsOptional()
  learnerId?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Appointment title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Start time of the appointment' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time of the appointment' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Appointment status', enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Additional notes about the appointment' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Location of the appointment' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Whether a reminder has been sent' })
  @IsBoolean()
  @IsOptional()
  reminderSent?: boolean;

  @ApiPropertyOptional({ description: 'ID of the client associated with this appointment' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID of the learner associated with this appointment' })
  @IsUUID()
  @IsOptional()
  learnerId?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ description: 'New appointment status', enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Notes about the status change' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateAttendanceRecordDto {
  @ApiProperty({ description: 'ID of the appointment' })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ description: 'ID of the learner' })
  @IsUUID()
  learnerId: string;

  @ApiProperty({ description: 'Attendance status', enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'NO_SHOW'] })
  @IsEnum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'NO_SHOW'])
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NO_SHOW';

  @ApiPropertyOptional({ description: 'Additional notes about the attendance' })
  @IsString()
  @IsOptional()
  notes?: string;
}
