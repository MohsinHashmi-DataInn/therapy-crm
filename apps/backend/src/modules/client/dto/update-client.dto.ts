import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';

/**
 * Data Transfer Object for updating an existing client
 * Extends CreateClientDto with all fields as optional
 */
export class UpdateClientDto extends PartialType(CreateClientDto) {}
