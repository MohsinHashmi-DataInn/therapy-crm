import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LearnerService } from './learner.service';
import { CreateLearnerDto, UpdateLearnerDto } from './dto/learner.dto';

@ApiTags('learners')
@Controller('learners')
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new learner' })
  @ApiResponse({ status: 201, description: 'Learner successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createLearnerDto: CreateLearnerDto) {
    return this.learnerService.create(createLearnerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all learners with optional filtering' })
  @ApiResponse({ status: 200, description: 'Return all learners' })
  async findAll(
    @Query('search') search?: string,
    @Query('course') course?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.learnerService.findAll({ 
      search, 
      course, 
      status, 
      clientId, 
      sortBy, 
      sortOrder 
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a learner by id' })
  @ApiResponse({ status: 200, description: 'Return the learner' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async findOne(@Param('id') id: string) {
    return this.learnerService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a learner' })
  @ApiResponse({ status: 200, description: 'Learner successfully updated' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async update(@Param('id') id: string, @Body() updateLearnerDto: UpdateLearnerDto) {
    return this.learnerService.update(id, updateLearnerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a learner' })
  @ApiResponse({ status: 200, description: 'Learner successfully deleted' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async remove(@Param('id') id: string) {
    return this.learnerService.remove(id);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all learners for a specific client' })
  @ApiResponse({ status: 200, description: 'Return all learners for the client' })
  async findByClient(@Param('clientId') clientId: string) {
    return this.learnerService.findByClient(clientId);
  }

  @Get('attendance/:learnerId')
  @ApiOperation({ summary: 'Get attendance records for a learner' })
  @ApiResponse({ status: 200, description: 'Return attendance records' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async getAttendanceRecords(
    @Param('learnerId') learnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.learnerService.getAttendanceRecords(learnerId, startDate, endDate);
  }
}
