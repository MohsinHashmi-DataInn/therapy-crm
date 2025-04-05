import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';

/**
 * DTO for updating a payment
 * Extends CreatePaymentDto but makes all properties optional
 * Cannot change the invoiceId of an existing payment
 */
export class UpdatePaymentDto extends PartialType(
  OmitType(CreatePaymentDto, ['invoiceId'] as const),
) {}
