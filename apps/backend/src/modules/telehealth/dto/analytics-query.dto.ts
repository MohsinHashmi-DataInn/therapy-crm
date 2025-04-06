import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsDate, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for querying telehealth analytics with date range parameters
 */
export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Start date for the analytics period',
    type: Date,
    required: true,
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date = new Date(new Date().setMonth(new Date().getMonth() - 1));

  @ApiProperty({
    description: 'End date for the analytics period',
    type: Date,
    required: true,
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date = new Date();

  @ApiProperty({
    description: 'Optional provider ID to filter results',
    type: String,
    required: false,
    example: '123',
  })
  @IsOptional()
  @IsString()
  providerId?: string;
}
