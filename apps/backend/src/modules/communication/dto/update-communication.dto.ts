import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateCommunicationDto } from './create-communication.dto';

/**
 * Data Transfer Object for updating an existing communication
 * Extends CreateCommunicationDto with all fields as optional
 */
export class UpdateCommunicationDto extends PartialType(CreateCommunicationDto) {}
