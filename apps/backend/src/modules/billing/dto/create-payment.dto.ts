import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, IsNumber, IsISO8601, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { PaymentMethod } from '../../../types/prisma-models';

// Re-export PaymentMethod for backward compatibility
export { PaymentMethod };

/**
 * DTO for creating a new payment
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'Invoice ID the payment is for',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  invoiceId: string = '';

  @ApiProperty({
    description: 'Amount of the payment in dollars',
    example: 125.00,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number = 0;

  @ApiProperty({
    description: 'Date of the payment (ISO 8601 format)',
    example: '2023-10-20',
  })
  @IsNotEmpty()
  @IsISO8601()
  date: string = '';

  @ApiProperty({
    description: 'Method of payment',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: PaymentMethod = PaymentMethod.CREDIT_CARD;

  @ApiProperty({
    description: 'Reference number for the payment (e.g., transaction ID, check number)',
    example: 'TXN-12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiProperty({
    description: 'Additional notes about the payment',
    example: 'Payment for October services',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({
    description: 'Insurance claim ID if payment is from insurance',
    example: 'CLM-98765',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insuranceClaimId?: string;

  @ApiProperty({
    description: 'Funding program reference if payment is from a funding program',
    example: 'FP-76543',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fundingProgramReference?: string;
}
