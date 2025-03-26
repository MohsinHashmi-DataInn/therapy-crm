import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';

/**
 * Data Transfer Object for updating an existing appointment
 * Extends CreateAppointmentDto with all fields as optional
 */
export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}
