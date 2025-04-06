import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, IsISO8601, IsEnum, IsBoolean, IsArray, IsNumber, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimStatus } from '../../../types/prisma-models';

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
  invoiceId: string = '';

  @ApiProperty({
    description: 'Insurance ID (client_insurance record)',
    example: '456789123',
  })
  @IsNotEmpty()
  @IsString()
  insuranceId: string = '';

  @ApiProperty({
    description: 'Policy number',
    example: 'POL123456',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  policyNumber: string = '';

  @ApiProperty({
    description: 'Beneficiary name (usually the client or guardian)',
    example: 'John Smith',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  beneficiaryName: string = '';

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
    example: ClaimStatus.PENDING,
    default: ClaimStatus.PENDING,
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

  @ApiProperty({
    description: 'Amount being claimed',
    example: '150.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  amountClaimed?: string;

  @ApiProperty({
    description: 'Amount approved by insurance',
    example: '120.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  amountApproved?: string;

  @ApiProperty({
    description: 'Reason for denial if claim was denied',
    example: 'Service not covered under policy',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  denialReason?: string;

  @ApiProperty({
    description: 'Date for follow-up on the claim (ISO 8601 format)',
    example: '2023-11-15',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  followUpDate?: string;
}
