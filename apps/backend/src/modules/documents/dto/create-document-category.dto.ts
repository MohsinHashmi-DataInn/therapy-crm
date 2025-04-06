import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class CreateDocumentCategoryDto {
  @ApiProperty({ description: 'Name of the document category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the document category' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Order in which to display the category', default: 0 })
  @IsInt()
  @IsOptional()
  display_order?: number;

  @ApiPropertyOptional({ description: 'ID of the user who created the category' })
  @IsOptional()
  created_by?: string;

  @ApiPropertyOptional({ description: 'ID of the user who updated the category' })
  @IsOptional()
  updated_by?: string;
}
