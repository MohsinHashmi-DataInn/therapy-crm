import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsDateString, 
  IsEnum, 
  IsInt, 
  IsJSON, 
  IsNotEmpty, 
  IsOptional, 
  Min, 
  ValidateIf 
} from 'class-validator';

// Define enum locally until available in Prisma client
export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

/**
 * Data Transfer Object for creating a recurrence pattern for appointments
 */
export class CreateRecurrencePatternDto {
  @ApiProperty({ 
    enum: RecurrenceFrequency,
    example: RecurrenceFrequency.WEEKLY,
    description: 'Frequency of the recurrence pattern'
  })
  @IsEnum(RecurrenceFrequency, { message: 'Frequency must be a valid recurrence frequency' })
  @IsNotEmpty({ message: 'Frequency is required' })
  frequency!: RecurrenceFrequency;

  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Interval between occurrences (e.g., every 2 weeks)',
    default: 1
  })
  @IsInt()
  @Min(1, { message: 'Interval must be at least 1' })
  @IsOptional()
  interval?: number = 1;

  @ApiPropertyOptional({ 
    example: '["MON", "WED", "FRI"]', 
    description: 'JSON array of days of the week for weekly patterns'
  })
  @IsJSON()
  @IsOptional()
  @ValidateIf(o => o.frequency === RecurrenceFrequency.WEEKLY || o.frequency === RecurrenceFrequency.BIWEEKLY)
  daysOfWeek?: string;

  @ApiProperty({ 
    example: '2025-04-01T00:00:00Z', 
    description: 'Start date for the recurring pattern (ISO format)'
  })
  @IsDateString()
  @IsNotEmpty({ message: 'Start date is required' })
  startDate!: string;

  @ApiPropertyOptional({ 
    example: '2025-06-30T00:00:00Z', 
    description: 'End date for the recurring pattern (ISO format)'
  })
  @IsDateString()
  @IsOptional()
  @ValidateIf(o => !o.occurrenceCount)
  endDate?: string;

  @ApiPropertyOptional({ 
    example: 12, 
    description: 'Number of occurrences (alternative to end date)'
  })
  @IsInt()
  @Min(1, { message: 'Occurrence count must be at least 1' })
  @IsOptional()
  @ValidateIf(o => !o.endDate)
  @Type(() => Number)
  occurrenceCount?: number;
}
