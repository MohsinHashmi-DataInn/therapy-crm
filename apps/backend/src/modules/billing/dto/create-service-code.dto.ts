import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, MinLength, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new service code
 */
export class CreateServiceCodeDto {
  @ApiProperty({
    description: 'Code identifier (e.g., CPT or custom code)',
    example: '97153',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({
    description: 'Description of the service',
    example: 'Adaptive Behavior Treatment by Protocol',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  description: string;

  @ApiProperty({
    description: 'Default rate for the service in dollars',
    example: 120.00,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  defaultRate: number;

  @ApiProperty({
    description: 'Unit of measure for the service (e.g., 15 min, hour, session)',
    example: '15 min',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  unit: string;

  @ApiProperty({
    description: 'Detailed information about when to use this code',
    example: 'Use for direct one-on-one ABA therapy delivered by a technician',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  guidelines?: string;

  @ApiProperty({
    description: 'Notes about insurance coverage',
    example: 'Covered by most insurance plans with autism benefits',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  insuranceNotes?: string;

  @ApiProperty({
    description: 'Whether the service code is currently active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({
    description: 'Category or type of service',
    example: 'ABA Therapy',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
