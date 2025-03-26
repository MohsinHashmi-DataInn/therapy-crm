import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth, 
  ApiQuery 
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';

// Define request interface
interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Controller handling appointment-related endpoints
 */
@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * Create a new appointment
   */
  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client, learner, or therapist not found' })
  @ApiResponse({ status: 409, description: 'Appointment conflicts with existing appointment' })
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req: RequestWithUser) {
    return this.appointmentService.create(createAppointmentDto, BigInt(req.user.id));
  }

  /**
   * Get all appointments with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all appointments with optional filtering' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiQuery({ name: 'therapistId', required: false, description: 'Filter by therapist ID' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'learnerId', required: false, description: 'Filter by learner ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by appointment status' })
  @ApiResponse({ status: 200, description: 'Returns all appointments matching the filters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('therapistId') therapistId?: string,
    @Query('clientId') clientId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('status') status?: string,
    @Request() req?: RequestWithUser,
  ) {
    // If user is therapist, only show their appointments
    if (req?.user.role === UserRole.THERAPIST) {
      therapistId = req.user.id.toString();
    }
    
    return this.appointmentService.findAll(
      startDate,
      endDate,
      therapistId,
      clientId,
      learnerId,
      status
    );
  }

  /**
   * Get appointment by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Returns the appointment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(BigInt(id));
  }

  /**
   * Update an appointment
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Appointment successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Appointment, client, learner, or therapist not found' })
  @ApiResponse({ status: 409, description: 'Appointment conflicts with existing appointment' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.appointmentService.update(
      BigInt(id),
      updateAppointmentDto,
      BigInt(req.user.id)
    );
  }

  /**
   * Delete an appointment
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Appointment successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  remove(@Param('id') id: string) {
    return this.appointmentService.remove(BigInt(id));
  }
}
