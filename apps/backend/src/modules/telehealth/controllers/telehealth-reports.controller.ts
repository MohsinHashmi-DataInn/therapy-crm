import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { TelehealthAnalyticsService } from '../services/telehealth-analytics.service';
import { ReportGeneratorService } from '../utils/report-generator.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

/**
 * Controller for telehealth report generation
 * Provides endpoints for generating and downloading reports in various formats
 */
@ApiTags('telehealth-reports')
@Controller('telehealth/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TelehealthReportsController {
  constructor(private readonly reportGeneratorService: ReportGeneratorService) {}

  /**
   * Generate and download Excel report for telehealth analytics
   * @param query Analytics query parameters
   * @param res Express response object
   */
  @Get('excel')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Generate Excel report for telehealth analytics' })
  @ApiResponse({
    status: 200,
    description: 'Excel report generated and downloaded successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error during report generation' })
  async generateExcelReport(
    @Query() query: AnalyticsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const providerId = query.providerId ? BigInt(query.providerId) : undefined;
    await this.reportGeneratorService.generateExcelReport(
      query.startDate,
      query.endDate,
      providerId,
      res,
    );
  }

  /**
   * Generate and download CSV report for telehealth sessions
   * @param query Analytics query parameters
   * @param res Express response object
   */
  @Get('csv')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Generate CSV report for telehealth sessions' })
  @ApiResponse({
    status: 200,
    description: 'CSV report generated and downloaded successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error during report generation' })
  async generateCsvReport(
    @Query() query: AnalyticsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const providerId = query.providerId ? BigInt(query.providerId) : undefined;
    await this.reportGeneratorService.generateCsvReport(
      query.startDate,
      query.endDate,
      providerId,
      res,
    );
  }
}
