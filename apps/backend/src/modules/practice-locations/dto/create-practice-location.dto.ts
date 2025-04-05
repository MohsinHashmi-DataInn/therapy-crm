import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for creating a new practice location
 */
export class CreatePracticeLocationDto {
  @ApiProperty({
    description: 'Name of the practice location',
    example: 'North Vancouver Therapy Center',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Physical address of the location',
    example: '123 Main Street',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'City where the location is situated',
    example: 'Vancouver',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Province or state',
    example: 'British Columbia',
    required: false,
  })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({
    description: 'Postal code',
    example: 'V7L 2P5',
    required: false,
  })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiProperty({
    description: 'Phone number for the location',
    example: '604-555-1234',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Email address for the location',
    example: 'north@therapycrm.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Hours of operation',
    example: 'Mon-Fri: 9am-5pm, Sat: 10am-2pm',
    required: false,
  })
  @IsString()
  @IsOptional()
  hours_of_operation?: string;

  @ApiProperty({
    description: 'Whether this is the primary location',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @ApiProperty({
    description: 'Whether the location is currently active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
