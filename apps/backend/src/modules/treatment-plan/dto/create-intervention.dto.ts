import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsArray, 
  IsEnum, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsPositive, 
  IsString 
} from 'class-validator';

/**
 * Enum for intervention types used in autism therapy
 */
export enum InterventionType {
  ABA = 'ABA',
  DTT = 'DTT',
  NATURALISTIC = 'NATURALISTIC',
  PECS = 'PECS',
  SOCIAL_STORIES = 'SOCIAL_STORIES',
  VISUAL_SUPPORTS = 'VISUAL_SUPPORTS',
  SENSORY_INTEGRATION = 'SENSORY_INTEGRATION',
  PROMPTING = 'PROMPTING',
  REINFORCEMENT = 'REINFORCEMENT',
  TOKEN_ECONOMY = 'TOKEN_ECONOMY',
  VIDEO_MODELING = 'VIDEO_MODELING',
  VERBAL_BEHAVIOR = 'VERBAL_BEHAVIOR',
  FLOOR_TIME = 'FLOOR_TIME',
  TEACCH = 'TEACCH',
  PARENT_TRAINING = 'PARENT_TRAINING',
  OTHER = 'OTHER',
  CUSTOM = 'CUSTOM'
}

/**
 * Enum for intervention session frequencies
 */
export enum SessionFrequency {
  DAILY = 'DAILY',
  TWICE_DAILY = 'TWICE_DAILY',
  WEEKLY = 'WEEKLY',
  TWICE_WEEKLY = 'TWICE_WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  AS_NEEDED = 'AS_NEEDED',
  CUSTOM = 'CUSTOM'
}

/**
 * Data Transfer Object for creating a new intervention
 */
export class CreateInterventionDto {
  @ApiProperty({ 
    enum: InterventionType, 
    example: InterventionType.ABA, 
    description: 'Type of intervention' 
  })
  @IsEnum(InterventionType, { message: 'Intervention type must be valid' })
  @IsNotEmpty({ message: 'Intervention type is required' })
  interventionType!: InterventionType;

  @ApiProperty({ 
    example: 'Discrete Trial Training for Communication Skills', 
    description: 'Title or name of the intervention' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @ApiPropertyOptional({ 
    example: 'A structured intervention focused on teaching communication skills...',
    description: 'Detailed description of the intervention' 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    example: 60, 
    description: 'Duration of each session in minutes' 
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  sessionDuration?: number;

  @ApiProperty({ 
    enum: SessionFrequency, 
    example: SessionFrequency.TWICE_WEEKLY, 
    description: 'Frequency of sessions' 
  })
  @IsEnum(SessionFrequency, { message: 'Session frequency must be valid' })
  @IsNotEmpty({ message: 'Session frequency is required' })
  sessionFrequency!: SessionFrequency;

  @ApiPropertyOptional({ 
    example: 'Every Monday and Wednesday afternoon', 
    description: 'Custom schedule details if frequency is CUSTOM' 
  })
  @IsString()
  @IsOptional()
  customFrequencyDetails?: string;

  @ApiPropertyOptional({ 
    example: 12, 
    description: 'Total number of planned sessions' 
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  totalSessions?: number;

  @ApiPropertyOptional({ 
    example: 'Picture cards, token board, reinforcement items',
    description: 'Materials or resources needed for the intervention' 
  })
  @IsString()
  @IsOptional()
  materialsRequired?: string;

  @ApiPropertyOptional({ 
    example: 'Data will be collected on prompted vs. unprompted responses...',
    description: 'Method for data collection during intervention' 
  })
  @IsString()
  @IsOptional()
  dataCollectionMethod?: string;

  @ApiPropertyOptional({ 
    example: ['Goal1', 'Goal2'],
    description: 'IDs of associated goals this intervention addresses'
  })
  @IsArray()
  @IsOptional()
  goalIds?: string[];
}
