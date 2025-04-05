import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, IsISO8601, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  APPEALED = 'APPEALED',
  PAID = 'PAID',
}

/**
 * DTO for creating a new insurance claim
 */
export class CreateInsuranceClaimDto {
  @ApiProperty({
    description: 'Invoice ID the claim is for',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiProperty({
    description: 'Insurance provider ID',
    example: '456789123',
  })
  @IsNotEmpty()
  @IsString()
  insuranceProviderId: string;

  @ApiProperty({
    description: 'Policy number',
    example: 'POL123456',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  policyNumber: string;

  @ApiProperty({
    description: 'Beneficiary name (usually the client or guardian)',
    example: 'John Smith',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  beneficiaryName: string;

  @ApiProperty({
    description: 'Date the claim was submitted (ISO 8601 format)',
    example: '2023-10-25',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  submissionDate?: string;

  @ApiProperty({
    description: 'Current status of the claim',
    enum: ClaimStatus,
    example: ClaimStatus.DRAFT,
    default: ClaimStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @ApiProperty({
    description: 'Claim number assigned by the insurance provider',
    example: 'CLM-12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  claimNumber?: string;

  @ApiProperty({
    description: 'Additional notes about the claim',
    example: 'Initial submission for ABA therapy services',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'IDs of invoice items to include in the claim (if not all)',
    example: ['123456789', '987654321'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invoiceItemIds?: string[];

  @ApiProperty({
    description: 'Whether to auto-generate a payment when claim is marked as paid',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  autoGeneratePayment?: boolean;
}
