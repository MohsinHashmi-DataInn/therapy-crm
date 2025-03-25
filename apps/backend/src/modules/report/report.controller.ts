import { Controller, Get, Post, Body, Query, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService } from './report.service';
import { GenerateReportDto, DashboardDataDto, ReportFormat } from './dto/report.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a report based on specified criteria' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async generateReport(
    @Body() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const report = await this.reportService.generateReport(generateReportDto);
    
    // Set appropriate headers based on format
    if (generateReportDto.format === ReportFormat.CSV) {
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename=report-${Date.now()}.csv`);
    } else if (generateReportDto.format === ReportFormat.EXCEL) {
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', `attachment; filename=report-${Date.now()}.xlsx`);
    } else if (generateReportDto.format === ReportFormat.PDF) {
      res.header('Content-Type', 'application/pdf');
      res.header('Content-Disposition', `attachment; filename=report-${Date.now()}.pdf`);
    } else {
      // Default JSON
      res.header('Content-Type', 'application/json');
    }
    
    return res.send(report);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard data for quick overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboardData(@Query() dashboardDataDto: DashboardDataDto) {
    return this.reportService.getDashboardData(dashboardDataDto);
  }

  @Get('upcoming-appointments')
  @ApiOperation({ summary: 'Get upcoming appointments for quick access' })
  @ApiResponse({ status: 200, description: 'Upcoming appointments retrieved successfully' })
  async getUpcomingAppointments(
    @Query('days') days: number = 7,
    @Query('clientId') clientId?: string,
  ) {
    return this.reportService.getUpcomingAppointments(days, clientId);
  }

  @Get('pending-follow-ups')
  @ApiOperation({ summary: 'Get pending follow-ups for quick access' })
  @ApiResponse({ status: 200, description: 'Pending follow-ups retrieved successfully' })
  async getPendingFollowUps() {
    return this.reportService.getPendingFollowUps();
  }

  @Get('learners-schedule')
  @ApiOperation({ summary: 'Get learners schedule for quick access' })
  @ApiResponse({ status: 200, description: 'Learners schedule retrieved successfully' })
  async getLearnersSchedule(
    @Query('date') date?: string,
    @Query('learnerId') learnerId?: string,
  ) {
    return this.reportService.getLearnersSchedule(date, learnerId);
  }

  @Get('attendance-rates')
  @ApiOperation({ summary: 'Get attendance rates for analysis' })
  @ApiResponse({ status: 200, description: 'Attendance rates retrieved successfully' })
  async getAttendanceRates(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('learnerId') learnerId?: string,
  ) {
    return this.reportService.getAttendanceRates(startDate, endDate, learnerId);
  }

  @Get('cancellation-patterns')
  @ApiOperation({ summary: 'Get cancellation patterns for analysis' })
  @ApiResponse({ status: 200, description: 'Cancellation patterns retrieved successfully' })
  async getCancellationPatterns(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.reportService.getCancellationPatterns(startDate, endDate, clientId);
  }
}
