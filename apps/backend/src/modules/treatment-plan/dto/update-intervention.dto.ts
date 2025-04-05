import { PartialType } from '@nestjs/swagger';
import { CreateInterventionDto } from './create-intervention.dto';

/**
 * Data Transfer Object for updating an existing intervention
 * Extends CreateInterventionDto but makes all fields optional
 */
export class UpdateInterventionDto extends PartialType(CreateInterventionDto) {}
