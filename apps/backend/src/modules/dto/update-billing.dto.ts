import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateBillingDto {
  @ApiPropertyOptional({
    description: 'The name associated with the billing account or card',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  billingName?: string;

  @ApiPropertyOptional({
    description: 'The email address for billing notifications and receipts',
    example: 'billing@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  billingEmail?: string;

  @ApiPropertyOptional({
    description: 'The street address for billing',
    example: '123 Billing St',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  billingAddress?: string;

  @ApiPropertyOptional({
    description: 'The city for the billing address',
    example: 'Billington',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingCity?: string;

  @ApiPropertyOptional({
    description: 'The state or province for the billing address',
    example: 'CA',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingState?: string;

  @ApiPropertyOptional({
    description: 'The zip or postal code for the billing address',
    example: '90210',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingZipCode?: string;
}
