import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { CommunicationType, CommunicationStatus } from '@prisma/client';

export class CreateCommunicationDto {
  @ApiProperty({ description: 'ID of the client for this communication' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ 
    description: 'Type of communication', 
    enum: CommunicationType, 
    default: CommunicationType.EMAIL 
  })
  @IsEnum(CommunicationType)
  type: CommunicationType;

  @ApiPropertyOptional({ description: 'Subject of the communication' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Content of the communication' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ 
    description: 'Date and time when the communication was sent', 
    default: 'Current date and time' 
  })
  @IsDateString()
  @IsOptional()
  sentAt?: string;

  @ApiPropertyOptional({ 
    description: 'Status of the communication', 
    enum: CommunicationStatus, 
    default: CommunicationStatus.SENT 
  })
  @IsEnum(CommunicationStatus)
  @IsOptional()
  status?: CommunicationStatus;
}

export class UpdateCommunicationDto {
  @ApiPropertyOptional({ description: 'Type of communication', enum: CommunicationType })
  @IsEnum(CommunicationType)
  @IsOptional()
  type?: CommunicationType;

  @ApiPropertyOptional({ description: 'Subject of the communication' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: 'Content of the communication' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Date and time when the communication was sent' })
  @IsDateString()
  @IsOptional()
  sentAt?: string;

  @ApiPropertyOptional({ description: 'Status of the communication', enum: CommunicationStatus })
  @IsEnum(CommunicationStatus)
  @IsOptional()
  status?: CommunicationStatus;

  @ApiPropertyOptional({ description: 'ID of the client for this communication' })
  @IsUUID()
  @IsOptional()
  clientId?: string;
}

export class CommunicationTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Template content with placeholders' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Type of communication this template is for', enum: CommunicationType })
  @IsEnum(CommunicationType)
  type: CommunicationType;
}
