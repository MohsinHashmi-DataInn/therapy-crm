import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentDto } from './create-assessment.dto';

/**
 * Data Transfer Object for updating an existing assessment
 * Extends CreateAssessmentDto but makes all fields optional
 */
export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {}
