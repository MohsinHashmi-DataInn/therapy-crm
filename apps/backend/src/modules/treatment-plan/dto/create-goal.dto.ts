import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsArray, 
  IsEnum, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsPositive, 
  IsString, 
  Min, 
  Max,
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum for goal domain categories in autism therapy
 */
export enum GoalDomain {
  COMMUNICATION = 'COMMUNICATION',
  SOCIAL = 'SOCIAL',
  BEHAVIOR = 'BEHAVIOR',
  SELF_HELP = 'SELF_HELP',
  MOTOR = 'MOTOR',
  COGNITIVE = 'COGNITIVE',
  PLAY = 'PLAY',
  ACADEMIC = 'ACADEMIC',
  VOCATIONAL = 'VOCATIONAL',
  OTHER = 'OTHER'
}

/**
 * Enum for goal priority levels
 */
export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Enum for goal mastery criteria
 */
export enum MasteryCriteria {
  PERCENTAGE = 'PERCENTAGE',
  FREQUENCY = 'FREQUENCY',
  DURATION = 'DURATION',
  RATE = 'RATE',
  OCCURRENCE = 'OCCURRENCE',
  TRIALS = 'TRIALS',
  CUSTOM = 'CUSTOM'
}

/**
 * Data Transfer Object for creating a new goal with mastery criteria
 */
export class MasteryConditionDto {
  @ApiProperty({ example: MasteryCriteria.PERCENTAGE, enum: MasteryCriteria })
  @IsEnum(MasteryCriteria)
  @IsNotEmpty()
  type!: MasteryCriteria;

  @ApiProperty({ example: 80, description: 'Target value for mastery' })
  @IsNumber()
  @IsNotEmpty()
  value!: number;

  @ApiPropertyOptional({ example: 3, description: 'Number of sessions/days/trials to meet criteria' })
  @IsNumber()
  @IsOptional()
  consecutiveCount?: number;

  @ApiPropertyOptional({ 
    example: 'Across 3 different settings', 
    description: 'Additional conditions for mastery' 
  })
  @IsString()
  @IsOptional()
  additionalConditions?: string;
}

/**
 * Data Transfer Object for creating a new goal
 */
export class CreateGoalDto {
  @ApiProperty({ 
    enum: GoalDomain, 
    example: GoalDomain.COMMUNICATION, 
    description: 'Domain category for the goal' 
  })
  @IsEnum(GoalDomain, { message: 'Goal domain must be valid' })
  @IsNotEmpty({ message: 'Goal domain is required' })
  domain!: GoalDomain;

  @ApiProperty({ 
    example: 'Request desired items using verbal language', 
    description: 'Short title or description of the goal' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Goal description is required' })
  description!: string;

  @ApiPropertyOptional({ 
    example: 'Client will request desired items using 2-3 word phrases...',
    description: 'Detailed long-form description of the goal with specific criteria' 
  })
  @IsString()
  @IsOptional()
  longTermObjective?: string;

  @ApiPropertyOptional({ 
    example: '1. Client will point to desired items when prompted...',
    description: 'Step-by-step benchmarks toward achieving the goal' 
  })
  @IsString()
  @IsOptional()
  shortTermObjectives?: string;

  @ApiProperty({ 
    enum: GoalPriority, 
    example: GoalPriority.HIGH,
    description: 'Priority level for the goal' 
  })
  @IsEnum(GoalPriority, { message: 'Goal priority must be valid' })
  @IsNotEmpty({ message: 'Goal priority is required' })
  priority!: GoalPriority;

  @ApiProperty({
    type: [MasteryConditionDto],
    description: 'Criteria for mastery of the goal'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasteryConditionDto)
  @IsNotEmpty({ message: 'At least one mastery condition is required' })
  masteryConditions!: MasteryConditionDto[];

  @ApiPropertyOptional({ 
    example: 30, 
    description: 'Baseline performance level (e.g., percentage)' 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  baselinePerformance?: number;

  @ApiPropertyOptional({ 
    example: 'Based on initial assessment conducted on 2023-05-10',
    description: 'Notes about the baseline measurement' 
  })
  @IsString()
  @IsOptional()
  baselineNotes?: string;

  @ApiPropertyOptional({ 
    example: 'Use visual supports and token system...',
    description: 'Methods, strategies, or techniques to be used' 
  })
  @IsString()
  @IsOptional()
  instructionalStrategies?: string;
}
