import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateLearnerDto } from './create-learner.dto';

/**
 * Data Transfer Object for updating an existing learner
 * Extends CreateLearnerDto with all fields as optional
 */
export class UpdateLearnerDto extends PartialType(CreateLearnerDto) {}
