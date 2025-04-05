import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUrl, MaxLength, MinLength, IsNumber, IsBoolean, Min, IsDate, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new funding program
 */
export class CreateFundingProgramDto {
  @ApiProperty({
    description: 'Name of the funding program',
    example: 'State Autism Funding Program',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Description of the funding program',
    example: 'State-funded program providing coverage for autism therapy services',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Maximum annual funding amount in dollars',
    example: 25000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxAnnualFunding?: number;

  @ApiProperty({
    description: 'Program contact email',
    example: 'funding@stateprogram.gov',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactEmail?: string;

  @ApiProperty({
    description: 'Program contact phone',
    example: '1-800-555-1234',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiProperty({
    description: 'Program website',
    example: 'https://www.statefunding.gov/autism',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @ApiProperty({
    description: 'Eligibility requirements',
    example: 'Child must have autism diagnosis and be under 18 years of age',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  eligibilityRequirements?: string;

  @ApiProperty({
    description: 'Application instructions',
    example: 'Parents must submit diagnosis documentation and complete the online application',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  applicationInstructions?: string;

  @ApiProperty({
    description: 'Renewal process',
    example: 'Annual renewal required by submitting updated documentation',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  renewalProcess?: string;

  @ApiProperty({
    description: 'Whether the program is currently active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({
    description: 'Program expiration date (ISO 8601 format)',
    example: '2023-12-31',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;
}
