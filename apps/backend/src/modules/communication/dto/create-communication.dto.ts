import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Define enum locally to match schema
export enum CommunicationType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SMS = 'SMS',
  LETTER = 'LETTER',
  MEETING = 'MEETING',
  OTHER = 'OTHER'
}

/**
 * Data Transfer Object for creating a new communication
 */
export class CreateCommunicationDto {
  @ApiProperty({ 
    enum: CommunicationType, 
    example: CommunicationType.EMAIL,
    description: 'Type of communication' 
  })
  @IsEnum(CommunicationType, { message: 'Type must be a valid communication type' })
  @IsNotEmpty({ message: 'Type is required' })
  type!: CommunicationType;

  @ApiProperty({ example: 'Session Follow-up', description: 'Subject of the communication' })
  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject!: string;

  @ApiProperty({ example: 'Following up on today\'s session...', description: 'Content of the communication' })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content!: string;

  @ApiPropertyOptional({ example: '2025-04-01T10:30:00Z', description: 'When the communication was sent (ISO format)' })
  @IsDateString()
  @IsOptional()
  sentAt?: string;

  @ApiPropertyOptional({ example: 'No response yet', description: 'Additional notes about the communication' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: '1', description: 'ID of the client' })
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId!: string;

  @ApiPropertyOptional({ example: '1', description: 'ID of the related learner (if applicable)' })
  @IsOptional()
  learnerId?: string;

  @ApiPropertyOptional({ example: '1', description: 'ID of the related appointment (if applicable)' })
  @IsOptional()
  appointmentId?: string;
}
