import { PartialType } from '@nestjs/swagger';
import { CreateMetricDto } from './create-metric.dto';

/**
 * Data Transfer Object for updating an analytics metric
 * Extends CreateMetricDto to make all fields optional
 */
export class UpdateMetricDto extends PartialType(CreateMetricDto) {}
