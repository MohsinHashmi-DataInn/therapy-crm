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
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { AnalyticsMetricsService } from './analytics-metrics.service';
import { CreateMetricDto, MetricCategory } from './dto/create-metric.dto';
import { UpdateMetricDto } from './dto/update-metric.dto';

/**
 * Controller for managing analytics metrics
 * Provides endpoints for CRUD operations on clinical and operational KPIs
 */
@ApiTags('analytics-metrics')
@Controller('analytics-metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsMetricsController {
  constructor(private readonly analyticsMetricsService: AnalyticsMetricsService) {}

  /**
   * Create a new analytics metric
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new analytics metric' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The analytics metric has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A metric with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or manager role',
  })
  async create(@Body() createMetricDto: CreateMetricDto, @Request() req: any) {
    return this.analyticsMetricsService.create(createMetricDto, BigInt(req.user.id));
  }

  /**
   * Get all analytics metrics with optional category filtering
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all analytics metrics with optional category filtering' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: MetricCategory,
    description: 'Filter metrics by category',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all analytics metrics matching the criteria',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findAll(@Request() req: any, @Query('category') category?: MetricCategory) {
    return this.analyticsMetricsService.findAll(category);
  }

  /**
   * Get a specific analytics metric by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific analytics metric by ID' })
  @ApiParam({ name: 'id', description: 'Analytics metric ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the analytics metric',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analytics metric not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findOne(@Param('id') id: string) {
    return this.analyticsMetricsService.findOne(BigInt(id));
  }

  /**
   * Get a specific analytics metric by name
   */
  @Get('by-name/:name')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific analytics metric by name' })
  @ApiParam({ name: 'name', description: 'Analytics metric name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the analytics metric',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analytics metric not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByName(@Param('name') name: string) {
    return this.analyticsMetricsService.findByName(name);
  }

  /**
   * Update an analytics metric
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update an analytics metric' })
  @ApiParam({ name: 'id', description: 'Analytics metric ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The analytics metric has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analytics metric not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A metric with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or manager role',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMetricDto: UpdateMetricDto,
    @Request() req: any,
  ) {
    return this.analyticsMetricsService.update(
      BigInt(id),
      updateMetricDto,
      BigInt(req.user.id),
    );
  }

  /**
   * Delete an analytics metric
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an analytics metric' })
  @ApiParam({ name: 'id', description: 'Analytics metric ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The analytics metric has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analytics metric not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete metric that is used in dashboard widgets',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin role',
  })
  async remove(@Param('id') id: string) {
    return this.analyticsMetricsService.remove(BigInt(id));
  }

  /**
   * Calculate and store a new value for a specific metric
   */
  @Post(':id/calculate')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Calculate and store a new value for a metric' })
  @ApiParam({ name: 'id', description: 'Analytics metric ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The metric value has been calculated and stored',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analytics metric not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or manager role',
  })
  async calculateMetricValue(@Param('id') id: string, @Request() req: any) {
    return this.analyticsMetricsService.calculateMetricValue(
      BigInt(id),
      BigInt(req.user.id),
    );
  }
}
