import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateInvoiceDto, CreateInvoiceItemDto } from './create-invoice.dto';
import { InvoiceStatus } from '../../../types/prisma-models';
import { IsOptional, IsArray, ValidateNested, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating an invoice item
 * Extends CreateInvoiceItemDto and adds an id field for existing items
 */
export class UpdateInvoiceItemDto extends PartialType(CreateInvoiceItemDto) {
  @ApiProperty({
    description: 'ID of an existing invoice item (required for updating existing items)',
    example: '123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;
}

/**
 * DTO for updating an invoice
 * Makes all fields optional and adds an items field for updating invoice items
 */
export class UpdateInvoiceDto extends PartialType(
  OmitType(CreateInvoiceDto, ['items'] as const),
) {
  @ApiProperty({
    description: 'Array of invoice line items to update or add',
    type: [UpdateInvoiceItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInvoiceItemDto)
  items?: UpdateInvoiceItemDto[];

  @ApiProperty({
    description: 'Array of invoice item IDs to remove',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  itemsToRemove?: string[];

  @ApiProperty({
    description: 'Current status of the invoice',
    enum: InvoiceStatus,
    example: InvoiceStatus.SENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
