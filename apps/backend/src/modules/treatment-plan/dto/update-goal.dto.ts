import { PartialType } from '@nestjs/swagger';
import { CreateGoalDto } from './create-goal.dto';

/**
 * Data Transfer Object for updating an existing goal
 * Extends CreateGoalDto but makes all fields optional
 */
export class UpdateGoalDto extends PartialType(CreateGoalDto) {}
