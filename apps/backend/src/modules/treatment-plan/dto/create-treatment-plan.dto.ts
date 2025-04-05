import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsArray, 
  IsDateString, 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGoalDto } from './create-goal.dto';
import { CreateInterventionDto } from './create-intervention.dto';

/**
 * Enum for treatment plan status
 */
export enum PlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Enum for treatment plan approval status
 */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_REVISION = 'NEEDS_REVISION'
}

/**
 * Data Transfer Object for creating a new treatment plan
 */
export class CreateTreatmentPlanDto {
  @ApiProperty({ 
    example: 'Initial Behavior Intervention Plan',
    description: 'Title of the treatment plan' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @ApiPropertyOptional({ 
    example: 'Comprehensive treatment plan focused on communication and behavior management',
    description: 'Description of the treatment plan' 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: '2023-06-01T00:00:00.000Z',
    description: 'Start date of the treatment plan' 
  })
  @IsDateString()
  @IsNotEmpty({ message: 'Start date is required' })
  startDate!: string;

  @ApiProperty({ 
    example: '2023-12-31T00:00:00.000Z',
    description: 'End date of the treatment plan' 
  })
  @IsDateString()
  @IsNotEmpty({ message: 'End date is required' })
  endDate!: string;

  @ApiPropertyOptional({ 
    example: '2023-12-01T00:00:00.000Z',
    description: 'Scheduled review date' 
  })
  @IsDateString()
  @IsOptional()
  reviewDate?: string;

  @ApiProperty({ 
    enum: PlanStatus,
    example: PlanStatus.DRAFT,
    description: 'Status of the treatment plan' 
  })
  @IsEnum(PlanStatus, { message: 'Status must be valid' })
  @IsNotEmpty({ message: 'Status is required' })
  status!: PlanStatus;

  @ApiProperty({ 
    enum: ApprovalStatus,
    example: ApprovalStatus.PENDING,
    description: 'Approval status of the treatment plan' 
  })
  @IsEnum(ApprovalStatus, { message: 'Approval status must be valid' })
  @IsNotEmpty({ message: 'Approval status is required' })
  approvalStatus!: ApprovalStatus;

  @ApiPropertyOptional({ 
    example: 'Plan is pending approval from clinical director',
    description: 'Notes regarding approval process' 
  })
  @IsString()
  @IsOptional()
  approvalNotes?: string;

  @ApiPropertyOptional({ 
    example: 'Based on assessment results from VB-MAPP conducted on May 15',
    description: 'Summary of assessments used for plan development' 
  })
  @IsString()
  @IsOptional()
  assessmentSummary?: string;

  @ApiPropertyOptional({ 
    example: ['1', '2'],
    description: 'IDs of related assessments used in developing the plan' 
  })
  @IsArray()
  @IsOptional()
  assessmentIds?: string[];

  @ApiProperty({ 
    example: '1',
    description: 'ID of the client this plan is for' 
  })
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId!: string;

  @ApiPropertyOptional({ 
    example: '1',
    description: 'ID of the learner this plan is for (if applicable)' 
  })
  @IsOptional()
  learnerId?: string;

  @ApiPropertyOptional({
    type: [CreateGoalDto],
    description: 'Goals to be created with this treatment plan'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoalDto)
  @IsOptional()
  goals?: CreateGoalDto[];

  @ApiPropertyOptional({
    type: [CreateInterventionDto],
    description: 'Interventions to be created with this treatment plan'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInterventionDto)
  @IsOptional()
  interventions?: CreateInterventionDto[];
}
