import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';

export enum ReportType {
  DAILY_SCHEDULE = 'DAILY_SCHEDULE',
  UPCOMING_APPOINTMENTS = 'UPCOMING_APPOINTMENTS',
  CLIENT_ACTIVITY = 'CLIENT_ACTIVITY',
  ATTENDANCE_RATES = 'ATTENDANCE_RATES',
  CANCELLATION_PATTERNS = 'CANCELLATION_PATTERNS',
  WAITLIST_STATUS = 'WAITLIST_STATUS',
  COMMUNICATION_HISTORY = 'COMMUNICATION_HISTORY',
}

export enum ReportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export class GenerateReportDto {
  @ApiProperty({ 
    description: 'Type of report to generate', 
    enum: ReportType 
  })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ 
    description: 'Format of the report output', 
    enum: ReportFormat,
    default: ReportFormat.JSON 
  })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Start date for report data range' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for report data range' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Client ID to filter report by' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Learner ID to filter report by' })
  @IsString()
  @IsOptional()
  learnerId?: string;

  @ApiPropertyOptional({ description: 'Whether to include detailed information in the report' })
  @IsBoolean()
  @IsOptional()
  detailed?: boolean;
}

export class DashboardDataDto {
  @ApiProperty({ description: 'Date for which to retrieve dashboard data' })
  @IsDateString()
  @IsOptional()
  date?: string;
}
