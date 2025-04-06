import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  Param, 
  UseGuards, 
  ParseIntPipe, 
  BadRequestException, 
  Res 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { BillingReportsService } from './services/billing-reports.service';
import { ReportType } from '../billing/enums/report-type.enum';
import { ReportPeriod } from '../billing/enums/report-period.enum';
import { Response } from 'express';

/**
 * Structure for report data returned by report generation methods
 */
export interface ReportData {
  headers: string[];
  data: any[];
  meta?: Record<string, any>;
}

interface GenerateReportDto {
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
  period?: ReportPeriod;
  clientId?: string;
  insuranceProviderId?: string;
  serviceCodeId?: string;
  limit?: number;
}

@ApiTags('billing-reports')
@Controller('billing/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: BillingReportsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Generate a financial report' })
  @ApiBody({
    description: 'Report parameters',
    type: Object,
    examples: {
      revenueByPeriod: {
        value: {
          reportType: 'REVENUE_BY_PERIOD',
          startDate: '2025-01-01',
          endDate: '2025-03-31',
          period: 'MONTHLY'
        }
      },
      outstandingInvoices: {
        value: {
          reportType: 'OUTSTANDING_INVOICES',
          limit: 50
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Report generated successfully',
  })
  async generateReport(@Body() reportParams: GenerateReportDto): Promise<ReportData> {
    // Convert date strings to Date objects if provided
    const params: any = { 
      ...reportParams,
      startDate: reportParams.startDate ? new Date(reportParams.startDate) : undefined,
      endDate: reportParams.endDate ? new Date(reportParams.endDate) : undefined,
    };

    // Convert ID strings to BigInt if provided
    if (reportParams.clientId) {
      params.clientId = BigInt(reportParams.clientId);
    }
    
    if (reportParams.insuranceProviderId) {
      params.insuranceProviderId = BigInt(reportParams.insuranceProviderId);
    }
    
    if (reportParams.serviceCodeId) {
      params.serviceCodeId = BigInt(reportParams.serviceCodeId);
    }

    // Validate report type
    if (!Object.values(ReportType).includes(reportParams.reportType as ReportType)) {
      throw new BadRequestException(`Invalid report type: ${reportParams.reportType}`);
    }

    return this.reportsService.generateReport(reportParams.reportType as ReportType, params);
  }

  @Get('types')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get available report types' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available report types'
  })
  getReportTypes() {
    return {
      reportTypes: Object.values(ReportType),
      periods: Object.values(ReportPeriod)
    };
  }

  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Export a report as CSV' })
  @ApiQuery({ name: 'reportType', enum: ReportType, required: true })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'CSV file containing report data'
  })
  async exportReportCsv(
    @Res() res: Response,
    @Query('reportType') reportType: ReportType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: ReportPeriod,
    @Query('clientId') clientId?: string,
    @Query('insuranceProviderId') insuranceProviderId?: string,
    @Query('limit') limit?: string
  ) {
    // Validate report type
    if (!Object.values(ReportType).includes(reportType)) {
      throw new BadRequestException(`Invalid report type: ${reportType}`);
    }

    // Prepare report parameters
    const params: any = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      period: period as ReportPeriod,
    };

    // Convert IDs to BigInt if provided
    if (clientId) {
      params.clientId = BigInt(clientId);
    }
    
    if (insuranceProviderId) {
      params.insuranceProviderId = BigInt(insuranceProviderId);
    }
    
    if (limit) {
      params.limit = parseInt(limit, 10);
    }

    // Generate the report
    const reportData = await this.reportsService.generateReport(reportType, params);
    
    // Convert to CSV
    // Use the private method directly since we're in the same module
    const csv = this.reportsService['exportReportToCsv'](reportData);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType.toLowerCase()}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    
    // Send the CSV data
    return res.send(csv);
  }

  @Get('revenue/period')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get revenue report by time period' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue report by period'
  })
  async getRevenueByPeriod(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: ReportPeriod,
  ): Promise<ReportData> {
    return this.reportsService.generateReport(
      ReportType.REVENUE_BY_PERIOD, 
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        period: period as ReportPeriod,
      }
    );
  }

  @Get('revenue/service')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get revenue report by service type' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue report by service'
  })
  async getRevenueByService(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ReportData> {
    return this.reportsService.generateReport(
      ReportType.REVENUE_BY_SERVICE, 
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    );
  }

  @Get('outstanding-invoices')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get report of outstanding invoices' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Outstanding invoices report'
  })
  async getOutstandingInvoices(
    @Query('clientId') clientId?: string,
    @Query('limit') limit?: string,
  ): Promise<ReportData> {
    return this.reportsService.generateReport(
      ReportType.OUTSTANDING_INVOICES, 
      {
        clientId: clientId ? BigInt(clientId) : undefined,
        limit: limit ? parseInt(limit, 10) : 100,
      }
    );
  }

  @Get('payment-collection')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get payment collection efficiency report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'period', enum: ReportPeriod, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment collection report'
  })
  async getPaymentCollection(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: ReportPeriod,
  ): Promise<ReportData> {
    return this.reportsService.generateReport(
      ReportType.PAYMENT_COLLECTION, 
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        period: period as ReportPeriod,
      }
    );
  }

  @Get('insurance-claims')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get insurance claim status report' })
  @ApiQuery({ name: 'insuranceProviderId', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Insurance claim status report'
  })
  async getInsuranceClaimStatus(
    @Query('insuranceProviderId') insuranceProviderId?: string,
  ): Promise<ReportData> {
    return this.reportsService.generateReport(
      ReportType.INSURANCE_CLAIM_STATUS, 
      {
        insuranceProviderId: insuranceProviderId ? BigInt(insuranceProviderId) : undefined,
      }
    );
  }
}
