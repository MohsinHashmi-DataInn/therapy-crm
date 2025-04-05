import { PartialType } from '@nestjs/swagger';
import { CreatePracticeLocationDto } from './create-practice-location.dto';

/**
 * Data Transfer Object for updating a practice location
 * Extends CreatePracticeLocationDto to make all fields optional
 */
export class UpdatePracticeLocationDto extends PartialType(CreatePracticeLocationDto) {}
