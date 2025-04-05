import { PartialType } from '@nestjs/swagger';
import { CreateTreatmentPlanDto } from './create-treatment-plan.dto';

/**
 * Data Transfer Object for updating an existing treatment plan
 * Extends CreateTreatmentPlanDto but makes all fields optional
 */
export class UpdateTreatmentPlanDto extends PartialType(CreateTreatmentPlanDto) {}
