import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  UpdateAppointmentStatusDto,
  CreateAttendanceRecordDto 
} from './dto/appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments with optional filtering' })
  @ApiResponse({ status: 200, description: 'Return all appointments' })
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('learnerId') learnerId?: string,
  ) {
    return this.appointmentService.findAll({
      startDate,
      endDate,
      status,
      clientId,
      learnerId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by id' })
  @ApiResponse({ status: 200, description: 'Return the appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment successfully updated' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment successfully deleted' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({ status: 200, description: 'Appointment status successfully updated' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentService.updateStatus(id, updateStatusDto);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all appointments for a specific client' })
  @ApiResponse({ status: 200, description: 'Return all appointments for the client' })
  async findByClient(@Param('clientId') clientId: string) {
    return this.appointmentService.findByClient(clientId);
  }

  @Get('learner/:learnerId')
  @ApiOperation({ summary: 'Get all appointments for a specific learner' })
  @ApiResponse({ status: 200, description: 'Return all appointments for the learner' })
  async findByLearner(@Param('learnerId') learnerId: string) {
    return this.appointmentService.findByLearner(learnerId);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get appointments for calendar view' })
  @ApiResponse({ status: 200, description: 'Return appointments for calendar' })
  async getCalendarView(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('day') day?: string,
    @Query('view') view?: 'month' | 'week' | 'day',
  ) {
    return this.appointmentService.getCalendarView(
      parseInt(year),
      parseInt(month),
      day ? parseInt(day) : undefined,
      view || 'month',
    );
  }

  @Post('attendance')
  @ApiOperation({ summary: 'Record attendance for an appointment' })
  @ApiResponse({ status: 201, description: 'Attendance successfully recorded' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async recordAttendance(@Body() createAttendanceDto: CreateAttendanceRecordDto) {
    return this.appointmentService.recordAttendance(createAttendanceDto);
  }

  @Get('status-history/:appointmentId')
  @ApiOperation({ summary: 'Get status history for an appointment' })
  @ApiResponse({ status: 200, description: 'Return status history' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getStatusHistory(@Param('appointmentId') appointmentId: string) {
    return this.appointmentService.getStatusHistory(appointmentId);
  }
}
