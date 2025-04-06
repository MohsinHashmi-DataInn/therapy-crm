import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray, IsBoolean, IsDate, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Title of the document' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of the document', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Document category ID', required: false })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ description: 'Client ID the document belongs to', required: false })
  @IsNumber()
  @IsOptional()
  clientId?: number;

  @ApiProperty({ description: 'Learner ID the document belongs to', required: false })
  @IsNumber()
  @IsOptional()
  learnerId?: number;

  @ApiProperty({ description: 'Array of tag strings for the document', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ 
    description: 'Security classification of the document', 
    required: false,
    enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']
  })
  @IsString()
  @IsOptional()
  securityClassification?: string;

  @ApiProperty({ description: 'Whether the document should be encrypted', required: false })
  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;

  @ApiProperty({ description: 'Number of days to retain the document (0 = indefinite)', required: false })
  @IsNumber()
  @IsOptional()
  retentionPeriodDays?: number;

  @ApiProperty({ description: 'Expiration date of the document in ISO format', required: false })
  @IsISO8601()
  @IsOptional()
  expirationDate?: string;
  
  // File will be handled by file interceptor in controller
}
