import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../modules/auth/guards/roles.guard';
import { Roles } from '../../../modules/auth/decorators/roles.decorator';
import { UserRole } from '../../../types/prisma-models';
import { TelehealthAnalyticsService } from '../services/telehealth-analytics.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';

/**
 * Controller for telehealth analytics
 * Provides endpoints for retrieving analytics and metrics for telehealth sessions
 */
@ApiTags('Telehealth Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telehealth/analytics')
export class TelehealthAnalyticsController {
  constructor(private readonly analyticsService: TelehealthAnalyticsService) {}

  /**
   * Get overall session analytics for a date range
   * 
   * @param query The analytics query parameters
   * @returns Session analytics for the specified period
   */
  @ApiOperation({ summary: 'Get overall session analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns analytics for virtual sessions in the specified period' 
  })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @Get()
  async getSessionAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSessionAnalytics(
      query.startDate,
      query.endDate
    );
  }

  /**
   * Get detailed metrics for a specific session
   * 
   * @param id Session ID
   * @returns Detailed session metrics
   */
  @ApiOperation({ summary: 'Get detailed metrics for a specific session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns detailed metrics for the specified session' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @Get('session/:id')
  async getSessionMetrics(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getSessionMetrics(BigInt(id));
  }

  /**
   * Get performance metrics for a specific provider
   * 
   * @param id Provider ID
   * @param query Query parameters including date range
   * @returns Provider performance metrics
   */
  @ApiOperation({ summary: 'Get performance metrics for a telehealth provider' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns performance metrics for the specified provider' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Provider not found' 
  })
  @Roles(UserRole.ADMIN)
  @Get('provider/:id')
  async getProviderPerformance(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getProviderPerformance(
      BigInt(id),
      query.startDate,
      query.endDate
    );
  }
}
