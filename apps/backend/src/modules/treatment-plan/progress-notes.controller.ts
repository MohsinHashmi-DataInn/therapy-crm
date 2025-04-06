import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { ProgressNotesService } from './progress-notes.service';
import { CreateProgressNoteDto } from './dto/create-progress-note.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';

/**
 * Controller responsible for managing progress notes and treatment goal tracking
 */
@ApiTags('progress-notes')
@Controller('progress-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProgressNotesController {
  constructor(private readonly progressNotesService: ProgressNotesService) {}

  /**
   * Create a new progress note with goal tracking
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Create a new progress note with goal tracking' })
  @ApiResponse({ status: 201, description: 'The progress note has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createProgressNoteDto: CreateProgressNoteDto, @GetUser('id') userId: number) {
    return this.progressNotesService.create(createProgressNoteDto, BigInt(userId));
  }

  /**
   * Get all progress notes for a treatment plan
   */
  @Get('treatment-plan/:id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all progress notes for a treatment plan' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 200, description: 'Returns the list of progress notes.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found.' })
  async findAllByTreatmentPlan(@Param('id') id: string) {
    const treatmentPlanId = parseInt(id);
    if (isNaN(treatmentPlanId)) {
      throw new BadRequestException('Invalid treatment plan ID');
    }
    return this.progressNotesService.findAllByTreatmentPlan(treatmentPlanId);
  }

  /**
   * Get a specific progress note by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get a specific progress note by ID' })
  @ApiParam({ name: 'id', description: 'Progress note ID' })
  @ApiResponse({ status: 200, description: 'Returns the progress note.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Progress note not found.' })
  async findOne(@Param('id') id: string) {
    const noteId = parseInt(id);
    if (isNaN(noteId)) {
      throw new BadRequestException('Invalid progress note ID');
    }
    return this.progressNotesService.findOne(noteId);
  }

  /**
   * Generate a progress report for a learner
   */
  @Get('report/learner/:id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Generate a progress report for a learner' })
  @ApiParam({ name: 'id', description: 'Learner ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns the progress report.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Learner not found.' })
  async generateProgressReport(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const learnerId = parseInt(id);
    if (isNaN(learnerId)) {
      throw new BadRequestException('Invalid learner ID');
    }
    
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    
    try {
      // Validate dates
      new Date(startDate);
      new Date(endDate);
    } catch (error) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    
    return this.progressNotesService.generateProgressReport(learnerId, startDate, endDate);
  }
}
