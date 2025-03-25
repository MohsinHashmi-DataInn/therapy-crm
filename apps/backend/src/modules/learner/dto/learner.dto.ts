import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { LearnerStatus } from '@prisma/client';

export class CreateLearnerDto {
  @ApiProperty({ description: 'Learner first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Learner last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Learner date of birth' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Course or program the learner is enrolled in' })
  @IsString()
  @IsOptional()
  course?: string;

  @ApiPropertyOptional({ description: 'Weekly schedule information' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Learner status', enum: LearnerStatus, default: LearnerStatus.ACTIVE })
  @IsEnum(LearnerStatus)
  @IsOptional()
  status?: LearnerStatus;

  @ApiPropertyOptional({ description: 'Start date of the learner in the program' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the learner' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'ID of the client (parent/guardian) associated with this learner' })
  @IsUUID()
  clientId: string;
}

export class UpdateLearnerDto {
  @ApiPropertyOptional({ description: 'Learner first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Learner last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Learner date of birth' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Course or program the learner is enrolled in' })
  @IsString()
  @IsOptional()
  course?: string;

  @ApiPropertyOptional({ description: 'Weekly schedule information' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Learner status', enum: LearnerStatus })
  @IsEnum(LearnerStatus)
  @IsOptional()
  status?: LearnerStatus;

  @ApiPropertyOptional({ description: 'Start date of the learner in the program' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the learner' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID of the client (parent/guardian) associated with this learner' })
  @IsUUID()
  @IsOptional()
  clientId?: string;
}
