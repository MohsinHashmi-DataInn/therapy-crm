import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateInsuranceClaimDto, ClaimStatus } from './create-insurance-claim.dto';
import { IsOptional, IsEnum, IsArray, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating an insurance claim
 * Makes all fields optional and adds fields for claim responses
 */
export class UpdateInsuranceClaimDto extends PartialType(
  OmitType(CreateInsuranceClaimDto, ['invoiceId'] as const),
) {
  @ApiProperty({
    description: 'Current status of the claim',
    enum: ClaimStatus,
    example: ClaimStatus.APPROVED,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @ApiProperty({
    description: 'Date the claim was responded to by the insurer (ISO 8601 format)',
    example: '2023-11-05',
    required: false,
  })
  @IsOptional()
  @IsString()
  responseDate?: string;

  @ApiProperty({
    description: 'Amount approved by insurance',
    example: 980.50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  approvedAmount?: number;

  @ApiProperty({
    description: 'Amount paid by insurance',
    example: 980.50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paidAmount?: number;

  @ApiProperty({
    description: 'Details of any denials or partial approvals',
    example: 'Service code 97153 approved at 80% coverage',
    required: false,
  })
  @IsOptional()
  @IsString()
  responseDetails?: string;

  @ApiProperty({
    description: 'Array of invoice item IDs to add to the claim',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invoiceItemsToAdd?: string[];

  @ApiProperty({
    description: 'Array of invoice item IDs to remove from the claim',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invoiceItemsToRemove?: string[];
}
