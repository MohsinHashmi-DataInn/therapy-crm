import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, MinLength, IsNumber, IsBoolean, IsISO8601, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  PENDING_INSURANCE = 'PENDING_INSURANCE',
  INSURANCE_DENIED = 'INSURANCE_DENIED',
}

export class CreateInvoiceItemDto {
  @ApiProperty({
    description: 'ID of the service code for this item',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  serviceCodeId: string;

  @ApiProperty({
    description: 'Description of the service provided',
    example: 'ABA Therapy Session',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  description: string;

  @ApiProperty({
    description: 'Quantity of units',
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Unit rate in dollars',
    example: 125.00,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate: number;

  @ApiProperty({
    description: 'Date of service (ISO 8601 format)',
    example: '2023-10-15',
  })
  @IsNotEmpty()
  @IsISO8601()
  dateOfService: string;

  @ApiProperty({
    description: 'ID of the appointment related to this service (if applicable)',
    example: '987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({
    description: 'Whether this item should be billed to insurance',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  billToInsurance?: boolean;

  @ApiProperty({
    description: 'Notes about this specific line item',
    example: 'Client responded well to therapy session',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/**
 * DTO for creating a new invoice
 */
export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Client ID the invoice is for',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @ApiProperty({
    description: 'Invoice number (if not auto-generated)',
    example: 'INV-2023-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceNumber?: string;

  @ApiProperty({
    description: 'Issue date of the invoice (ISO 8601 format)',
    example: '2023-10-18',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  issueDate?: string;

  @ApiProperty({
    description: 'Due date of the invoice (ISO 8601 format)',
    example: '2023-11-17',
  })
  @IsNotEmpty()
  @IsISO8601()
  dueDate: string;

  @ApiProperty({
    description: 'Current status of the invoice',
    enum: InvoiceStatus,
    example: InvoiceStatus.DRAFT,
    default: InvoiceStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({
    description: 'Additional notes for the invoice',
    example: 'Please pay within 30 days',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'Insurance provider ID if billing to insurance',
    example: '456789123',
    required: false,
  })
  @IsOptional()
  @IsString()
  insuranceProviderId?: string;

  @ApiProperty({
    description: 'Array of invoice line items',
    type: [CreateInvoiceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiProperty({
    description: 'Insurance policy number, if applicable',
    example: 'POL123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyNumber?: string;

  @ApiProperty({
    description: 'Beneficiary name if different from client',
    example: 'John Smith',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  beneficiaryName?: string;

  @ApiProperty({
    description: 'Funding program ID if using a funding program',
    example: '789123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  fundingProgramId?: string;

  @ApiProperty({
    description: 'Whether to send an email notification to the client',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendNotification?: boolean;
}
