import { PartialType } from '@nestjs/swagger';
import { CreateCaregiverDto } from './create-caregiver.dto';

/**
 * Data Transfer Object for updating an existing caregiver
 * Extends CreateCaregiverDto but makes all fields optional
 */
export class UpdateCaregiverDto extends PartialType(CreateCaregiverDto) {}
