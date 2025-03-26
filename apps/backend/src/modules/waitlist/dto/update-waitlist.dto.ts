import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateWaitlistDto } from './create-waitlist.dto';

/**
 * Data Transfer Object for updating an existing waitlist entry
 * Extends CreateWaitlistDto with all fields as optional
 */
export class UpdateWaitlistDto extends PartialType(CreateWaitlistDto) {}
