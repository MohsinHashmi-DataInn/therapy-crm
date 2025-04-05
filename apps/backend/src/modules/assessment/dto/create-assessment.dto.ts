import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsJSON, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Enum for assessment types commonly used in autism therapy
 */
export enum AssessmentType {
  ABLLS_R = 'ABLLS_R',
  VB_MAPP = 'VB_MAPP',
  ADOS_2 = 'ADOS_2',
  CARS_2 = 'CARS_2',
  SCQ = 'SCQ',
  ADI_R = 'ADI_R',
  BEHAVIOR_ASSESSMENT = 'BEHAVIOR_ASSESSMENT',
  SKILL_ASSESSMENT = 'SKILL_ASSESSMENT',
  FUNCTIONAL_ASSESSMENT = 'FUNCTIONAL_ASSESSMENT',
  ACADEMIC_ASSESSMENT = 'ACADEMIC_ASSESSMENT',
  CUSTOM = 'CUSTOM',
  OTHER = 'OTHER'
}

/**
 * Data Transfer Object for creating a new assessment
 */
export class CreateAssessmentDto {
  @ApiProperty({ 
    enum: AssessmentType,
    example: AssessmentType.VB_MAPP,
    description: 'Type of assessment' 
  })
  @IsEnum(AssessmentType, { message: 'Assessment type must be valid' })
  @IsNotEmpty({ message: 'Assessment type is required' })
  assessmentType!: AssessmentType;

  @ApiProperty({ 
    example: '2023-05-15T14:00:00.000Z', 
    description: 'Date when assessment was performed' 
  })
  @IsDateString()
  @IsNotEmpty({ message: 'Assessment date is required' })
  assessmentDate!: string;

  @ApiPropertyOptional({ 
    example: 'Jane Smith, BCBA', 
    description: 'Name or identifier of the person who performed the assessment' 
  })
  @IsString()
  @IsOptional()
  evaluator?: string;

  @ApiPropertyOptional({ 
    example: '{"communication": 4, "socialization": 3, "play": 2}', 
    description: 'Assessment scores in JSON format' 
  })
  @IsJSON()
  @IsOptional()
  scores?: string;

  @ApiPropertyOptional({ 
    example: 'Client shows significant progress in verbal communication.',
    description: 'Summary of assessment findings' 
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ 
    example: 'Continue with current speech therapy program and add visual supports.',
    description: 'Recommendations based on assessment results' 
  })
  @IsString()
  @IsOptional()
  recommendations?: string;

  @ApiPropertyOptional({ 
    example: 'Client was highly engaged throughout the assessment.',
    description: 'Additional notes about the assessment process or results' 
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ 
    example: '1', 
    description: 'ID of the client being assessed' 
  })
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId!: string;

  @ApiPropertyOptional({ 
    example: '1', 
    description: 'ID of the learner being assessed (if applicable)' 
  })
  @IsOptional()
  learnerId?: string;
}
