import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Define enums locally to match schema
export enum LearnerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  ON_HOLD = 'ON_HOLD'
}

/**
 * Data Transfer Object for creating a new learner
 */
export class CreateLearnerDto {
  @ApiProperty({ example: 'John', description: 'Learner first name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Learner last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiPropertyOptional({ example: '2000-01-01', description: 'Learner date of birth (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Male', description: 'Learner gender' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'Mathematics', description: 'Course or subject' })
  @IsString()
  @IsOptional()
  course?: string;

  @ApiPropertyOptional({ example: 'Mondays and Wednesdays, 4-5 PM', description: 'Typical schedule' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({
    enum: LearnerStatus,
    default: LearnerStatus.ACTIVE,
    description: 'Learner status'
  })
  @IsEnum(LearnerStatus, { message: 'Status must be a valid learner status' })
  @IsOptional()
  status?: LearnerStatus = LearnerStatus.ACTIVE;

  @ApiPropertyOptional({ example: 'Has difficulty with focus', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: '1', description: 'ID of parent client' })
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId!: string;

  @ApiPropertyOptional({ example: '1', description: 'ID of assigned instructor' })
  @IsOptional()
  instructorId?: string;
}
