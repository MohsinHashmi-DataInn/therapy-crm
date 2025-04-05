import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * Data Transfer Object for creating therapy equipment
 */
export class CreateTherapyEquipmentDto {
  @ApiProperty({ example: 'Weighted Vest Set', description: 'Name of the therapy equipment' })
  @IsString()
  @IsNotEmpty({ message: 'Equipment name is required' })
  name!: string;

  @ApiPropertyOptional({ 
    example: 'Set of weighted vests in different sizes (XS, S, M, L) for sensory integration therapy', 
    description: 'Detailed description of the equipment'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    example: 5, 
    description: 'The quantity of this item available',
    default: 1
  })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number = 1;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Whether the equipment is currently available for use',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean = true;

  @ApiPropertyOptional({ 
    example: 'Store in cabinet 3 when not in use', 
    description: 'Additional notes about the equipment'
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
