import { PartialType } from '@nestjs/swagger';
import { CreateServiceCodeDto } from './create-service-code.dto';

/**
 * DTO for updating a service code
 * Extends CreateServiceCodeDto but makes all properties optional
 */
export class UpdateServiceCodeDto extends PartialType(CreateServiceCodeDto) {}
