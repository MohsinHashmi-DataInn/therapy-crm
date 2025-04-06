import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Title of the document' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the document' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Document category ID' })
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({ description: 'Client ID associated with the document' })
  @IsOptional()
  client_id?: string;

  @ApiPropertyOptional({ 
    description: 'Security classification of the document',
    enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
    default: 'INTERNAL'
  })
  @IsString()
  @IsOptional()
  security_classification?: string;
}
