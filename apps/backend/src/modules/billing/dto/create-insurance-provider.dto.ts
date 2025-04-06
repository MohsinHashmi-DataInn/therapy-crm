import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUrl, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for creating a new insurance provider
 */
export class CreateInsuranceProviderDto {
  @ApiProperty({
    description: 'Name of the insurance provider',
    example: 'Blue Cross Blue Shield',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string = '';

  @ApiProperty({
    description: 'Contact email for the insurance provider',
    example: 'claims@bcbs.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'Contact phone for the insurance provider',
    example: '1-800-123-4567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'Website URL of the insurance provider',
    example: 'https://www.bcbs.com',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @ApiProperty({
    description: 'Address of the insurance provider',
    example: '123 Insurance Blvd, Chicago, IL 60601',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    description: 'Notes about the insurance provider',
    example: 'Requires pre-authorization for ABA therapy',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'Claim submission instructions',
    example: 'Submit claims through provider portal or via fax',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  claimSubmissionInstructions?: string;

  @ApiProperty({
    description: 'Payer ID for electronic claim submission',
    example: 'BCBS123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  payerId?: string;
}
