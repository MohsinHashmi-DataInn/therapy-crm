import { IsNotEmpty, IsString, IsNumber, IsOptional, IsISO8601, IsObject, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GoalProgressDto {
  @ApiProperty({ description: 'ID of the treatment goal' })
  @IsNumber()
  @IsNotEmpty()
  goalId: number;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @IsNumber()
  @IsNotEmpty()
  progressPercentage: number;

  @ApiProperty({ description: 'Status of the goal (NOT_STARTED, IN_PROGRESS, MASTERED, etc.)' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Additional measurement data points as JSON', required: false })
  @IsObject()
  @IsOptional()
  dataPoints?: Record<string, any>;

  @ApiProperty({ description: 'Additional notes on this goal progress', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateProgressNoteDto {
  @ApiProperty({ description: 'ID of the treatment plan' })
  @IsNumber()
  @IsNotEmpty()
  treatmentPlanId: number;

  @ApiProperty({ description: 'ID of the learner' })
  @IsNumber()
  @IsNotEmpty()
  learnerId: number;

  @ApiProperty({ description: 'Date of the therapy session' })
  @IsISO8601()
  @IsNotEmpty()
  sessionDate: string;

  @ApiProperty({ description: 'Main content of the progress note' })
  @IsString()
  @IsNotEmpty()
  noteContent: string;

  @ApiProperty({ description: 'Type of assessment used (e.g., ABLLS, VB-MAPP)', required: false })
  @IsString()
  @IsOptional()
  assessmentType?: string;

  @ApiProperty({ description: 'Overall assessment score if applicable', required: false })
  @IsNumber()
  @IsOptional()
  assessmentScore?: number;

  @ApiProperty({ description: 'Progress indicators as JSON object', required: false })
  @IsObject()
  @IsOptional()
  progressIndicators?: Record<string, any>;

  @ApiProperty({ description: 'Behaviors observed during session', required: false })
  @IsString()
  @IsOptional()
  behaviorsObserved?: string;

  @ApiProperty({ description: 'Notes on intervention effectiveness', required: false })
  @IsString()
  @IsOptional()
  interventionEffectiveness?: string;

  @ApiProperty({ description: 'Progress for individual goals', type: [GoalProgressDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalProgressDto)
  goalProgress: GoalProgressDto[];
}
