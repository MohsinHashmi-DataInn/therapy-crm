import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum for metric categories
 */
export enum MetricCategory {
  CLINICAL = 'CLINICAL',
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL',
}

/**
 * Data Transfer Object for creating a new analytics metric
 */
export class CreateMetricDto {
  @ApiProperty({
    description: 'Unique name for the metric',
    example: 'therapy_hours_delivered',
  })
  @IsString()
  metric_name: string = '';

  @ApiProperty({
    description: 'Category of the metric',
    enum: MetricCategory,
    example: MetricCategory.CLINICAL,
  })
  @IsEnum(MetricCategory)
  metric_category: MetricCategory = MetricCategory.CLINICAL;

  @ApiProperty({
    description: 'Human-readable description of the metric',
    example: 'Total therapy hours delivered',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Formula or calculation method for the metric',
    example: 'SUM(appointment_duration)',
    required: false,
  })
  @IsString()
  @IsOptional()
  calculation_formula?: string;

  @ApiProperty({
    description: 'Whether the metric should be displayed on dashboards by default',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  show_on_dashboard?: boolean;
}
