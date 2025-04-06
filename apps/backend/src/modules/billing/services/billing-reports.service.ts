import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ReportType } from '../enums/report-type.enum';
import { InvoiceStatus, ClaimStatus, PrismaExtensions } from '../../../types/prisma-models';
import { Prisma } from '@prisma/client';

/**
 * Structure for report data returned by report generation methods
 */
interface ReportData {
  headers: string[];
  data: any[];
  meta?: Record<string, any>;
}

@Injectable()
export class BillingReportsService {
  private readonly logger = new Logger(BillingReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
 * Generate a financial report based on the report type and parameters
 * @param reportType Type of report to generate
 * @param params Report parameters (dates, filters, etc.)
 * @returns The generated report data
 */
async generateReport(reportType: ReportType, params: any = {}): Promise<ReportData> {
    try {
      this.logger.log(`Generating ${reportType} report with params: ${JSON.stringify(params)}`);

      switch (reportType) {
        case ReportType.REVENUE_BY_PERIOD:
          return this.generateRevenueByPeriodReport(params.startDate, params.endDate, params.period || 'monthly');

        case ReportType.REVENUE_BY_SERVICE:
          return this.generateRevenueByServiceReport(params.startDate, params.endDate);

        case ReportType.OUTSTANDING_INVOICES:
          return this.generateOutstandingInvoicesReport(params.limit || 100, params.clientId);

        case ReportType.PAYMENT_COLLECTION:
          return this.generatePaymentCollectionReport(params.startDate, params.endDate, params.period || 'monthly');

        case ReportType.INSURANCE_CLAIM_STATUS:
          return this.generateInsuranceClaimStatusReport(params.insuranceProviderId);

        default:
          throw new NotFoundException(`Unsupported report type: ${reportType}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to generate ${reportType} report: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Failed to generate ${reportType} report: ${String(error)}`);
      }
      throw error;
    }
  }

  /**
   * Generate a report of revenue grouped by time period
   * @param startDate Start date for the report period
   * @param endDate End date for the report period
   * @param period Time period grouping (daily, weekly, monthly, etc.)
   * @returns Revenue data grouped by time period
   */
  private async generateRevenueByPeriodReport(startDate: Date, endDate: Date, period: string): Promise<ReportData> {
    // Format for grouping by selected period
    let dateFormat: string;
    let periodLabel: string;

    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        periodLabel = 'day';
        break;
      case 'weekly':
        dateFormat = '%Y-%U'; // ISO week number
        periodLabel = 'week';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        periodLabel = 'month';
        break;
      case 'quarterly':
        dateFormat = "%Y-Q%Q"; // Quarter (1-4)
        periodLabel = 'quarter';
        break;
      case 'yearly':
        dateFormat = '%Y';
        periodLabel = 'year';
        break;
      default:
        dateFormat = '%Y-%m';
        periodLabel = 'month';
    }

    // Get invoice data grouped by period
    const invoiceData = await this.prisma.$queryRaw<Array<{
      period: string;
      revenue: number;
      paymentCount: number;
    }>>`
      SELECT
        DATE_FORMAT(p.date, ${dateFormat}) as period,
        SUM(p.amount) as revenue,
        COUNT(p.id) as paymentCount
      FROM 
        payments p
      WHERE 
        p.date >= ${startDate} AND 
        p.date <= ${endDate}
      GROUP BY 
        period
      ORDER BY
        period ASC
    `;

    return {
      headers: ['period', 'revenue', 'paymentCount'],
      data: invoiceData,
      meta: {
        periodLabel,
      },
    };
  }

  /**
   * Generate a report of revenue grouped by service type
   * @param startDate Start date for the report period
   * @param endDate End date for the report period
   * @returns Revenue data grouped by service type
   */
  private async generateRevenueByServiceReport(startDate: Date, endDate: Date): Promise<ReportData> {
    const serviceData = await this.prisma.$queryRaw<Array<{
      serviceCode: string;
      serviceName: string;
      billed: number;
      collected: number;
    }>>`
      SELECT
        sc.code as serviceCode,
        sc.name as serviceName,
        SUM(si.total_amount) as billed,
        SUM(
          CASE
            WHEN i.status = 'PAID' THEN si.total_amount
            WHEN i.status = 'PARTIALLY_PAID' THEN 
              (SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id) * 
              (si.total_amount / i.total_amount)
            ELSE 0
          END
        ) as collected
      FROM 
        service_items si
      JOIN 
        service_codes sc ON si.service_code_id = sc.id
      JOIN 
        invoices i ON si.invoice_id = i.id
      WHERE 
        i.issue_date >= ${startDate} AND 
        i.issue_date <= ${endDate}
      GROUP BY 
        sc.id, sc.code, sc.name
      ORDER BY
        billed DESC
    `;

    return {
      headers: ['serviceCode', 'serviceName', 'billed', 'collected'],
      data: serviceData,
    };
  }

  /**
   * Generate a report of outstanding invoices
   * @param limit Maximum number of invoices to include
   * @param clientId Optional client ID to filter by
   * @returns List of outstanding invoices
   */
  private async generateOutstandingInvoicesReport(limit: number, clientId?: bigint): Promise<ReportData> {
    const whereClause: any = {
      status: {
        in: [
          InvoiceStatus.DRAFT,
          InvoiceStatus.SENT,
          InvoiceStatus.PARTIALLY_PAID,
          InvoiceStatus.OVERDUE
        ]
      }
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    const outstandingInvoices = await this.prisma.$queryRaw<Array<{
      id: string;
      invoiceNumber: string;
      issueDate: Date;
      dueDate: Date;
      clientId: string;
      totalAmount: number;
      amountPaid: number;
      status: string;
      client_id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      payments: string;
    }>>`
      SELECT 
        i.id, 
        i.invoice_number as "invoiceNumber", 
        i.issue_date as "issueDate", 
        i.due_date as "dueDate", 
        i.client_id as "clientId", 
        i.total_amount as "totalAmount", 
        i.amount_paid as "amountPaid", 
        i.status,
        c.id as "client_id", 
        c.first_name as "firstName", 
        c.last_name as "lastName", 
        c.email, 
        c.phone,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', p.id, 'amount', p.amount, 'date', p.date, 'method', p.method)) 
         FROM payments p 
         WHERE p.invoice_id = i.id 
         ORDER BY p.date DESC 
         LIMIT 1) as "payments"
      FROM 
        invoices i
      JOIN 
        clients c ON i.client_id = c.id
      WHERE 
        i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
        ${clientId ? PrismaExtensions.sql`AND i.client_id = ${clientId}` : PrismaExtensions.sql``}
      ORDER BY 
        i.due_date ASC, 
        i.total_amount DESC
      LIMIT ${limit}
    `;

    // Calculate days overdue and amount due
    const enrichedInvoices = outstandingInvoices.map((invoice: any) => {
      const today = new Date();
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      const amountDue = Number(invoice.totalAmount) - Number(invoice.amountPaid);

      return {
        ...invoice,
        daysOverdue,
        amountDue,
        lastPayment: invoice.payments.length > 0 ? invoice.payments[0] : null,
      };
    });

    // Calculate summary statistics
    const totalOutstanding = enrichedInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.amountDue), 0);

    const averageDaysOverdue = enrichedInvoices
      .filter((invoice: any) => invoice.daysOverdue > 0)
      .reduce((sum: number, invoice: any, _: any, array: any) => sum + invoice.daysOverdue / array.length, 0);

    return {
      headers: ['invoiceNumber', 'issueDate', 'dueDate', 'clientId', 'totalAmount', 'amountPaid', 'status', 'daysOverdue', 'amountDue', 'lastPayment'],
      data: enrichedInvoices,
      meta: {
        totalOutstanding,
        averageDaysOverdue: isNaN(averageDaysOverdue) ? 0 : averageDaysOverdue,
      },
    };
  }

  /**
   * Generate a report on payment collection efficiency
   * @param startDate Start date for the report period
   * @param endDate End date for the report period
   * @param period Time period grouping (monthly, quarterly, etc.)
   * @returns Payment collection efficiency data
   */
  private async generatePaymentCollectionReport(startDate: Date, endDate: Date, period: string): Promise<ReportData> {
    // Format for grouping by selected period
    let dateFormat: string;
    let periodLabel: string;

    switch (period) {
      case 'monthly':
        dateFormat = '%Y-%m';
        periodLabel = 'month';
        break;
      case 'quarterly':
        dateFormat = '%Y-Q%Q';
        periodLabel = 'quarter';
        break;
      case 'yearly':
        dateFormat = '%Y';
        periodLabel = 'year';
        break;
      default:
        dateFormat = '%Y-%m';
        periodLabel = 'month';
    }

    // Get invoice and payment data
    const collectionData = await this.prisma.$queryRaw<Array<{
      period: string;
      totalBilled: number;
      totalCollected: number;
      invoiceCount: number;
      avgDaysToPayment: number;
    }>>`
      SELECT
        DATE_FORMAT(i.issue_date, ${dateFormat}) as period,
        SUM(i.total_amount) as totalBilled,
        SUM(COALESCE(p.total_paid, 0)) as totalCollected,
        COUNT(DISTINCT i.id) as invoiceCount,
        AVG(COALESCE(p.avg_days_to_pay, 0)) as avgDaysToPayment
      FROM invoices i
      LEFT JOIN (
        SELECT invoice_id, SUM(amount) as total_paid, 
          AVG(DATEDIFF(date, i2.issue_date)) as avg_days_to_pay
        FROM payments
        JOIN invoices i2 ON payments.invoice_id = i2.id
        GROUP BY invoice_id
      ) p ON i.id = p.invoice_id
      WHERE i.issue_date >= ${startDate} AND i.issue_date <= ${endDate}
      GROUP BY period
      ORDER BY
        period ASC
    `;

    // Calculate collection efficiency
    const enrichedData = collectionData.map((item) => ({
      ...item,
      collectionRate: item.totalBilled > 0 ? Number((Number(item.totalCollected) / Number(item.totalBilled) * 100).toFixed(2)) : 0,
    }));

    const totalBilled = enrichedData.reduce((sum: number, item) => sum + Number(item.totalBilled), 0);
    const totalCollected = enrichedData.reduce((sum: number, item) => sum + Number(item.totalCollected), 0);

    return {
      headers: ['period', 'totalBilled', 'totalCollected', 'invoiceCount', 'avgDaysToPayment', 'collectionRate'],
      data: enrichedData,
      meta: {
        totalBilled,
        totalCollected,
        overallCollectionRate: totalBilled > 0 ? Number((totalCollected / totalBilled * 100).toFixed(2)) : 0,
      },
    };
  }

  /**
   * Generate a report on insurance claim status
   * @param insuranceProviderId Optional insurance provider ID to filter by
   * @returns Insurance claim status data
   */
  private async generateInsuranceClaimStatusReport(insuranceProviderId?: bigint): Promise<ReportData> {
    const whereClause: any = {};

    if (insuranceProviderId) {
      whereClause.insurance_provider_id = insuranceProviderId;
    }

    // Get claims grouped by status
    const claimsByStatus = await this.prisma.$queryRaw<Array<{
      status: string;
      count: number;
      total_claimed: number;
      total_approved: number;
    }>>`
      SELECT status, COUNT(*) as count, SUM(amount_claimed) as total_claimed,
        SUM(amount_approved) as total_approved
      FROM insurance_claims
      ${insuranceProviderId ? PrismaExtensions.sql`WHERE insurance_provider_id = ${insuranceProviderId}` : PrismaExtensions.sql``}
      GROUP BY status
    `;

    // Get claims grouped by provider
    const claimsByProvider = await this.prisma.$queryRaw<Array<{
      insurance_provider_id: number;
      count: number;
      total_claimed: number;
      total_approved: number;
    }>>`
      SELECT insurance_provider_id, COUNT(*) as count, SUM(amount_claimed) as total_claimed,
        SUM(amount_approved) as total_approved
      FROM insurance_claims
      ${insuranceProviderId ? PrismaExtensions.sql`WHERE insurance_provider_id = ${insuranceProviderId}` : PrismaExtensions.sql``}
      GROUP BY insurance_provider_id
    `;

    // Get provider details
    let providers: any[] = [];
    if (claimsByProvider.length > 0) {
      const providerIds = claimsByProvider.map((claim) => claim.insurance_provider_id);
      providers = await this.prisma.$queryRaw<Array<{
        id: number;
        name: string;
      }>>`
        SELECT id, name
        FROM insurance_providers
        WHERE id IN (${PrismaExtensions.join(providerIds)})
      `;
    }

    // Enrich provider data
    const providersData = claimsByProvider.map((item) => {
      const provider = providers.find((p) => p.id === item.insurance_provider_id);
      const approvalRate = item.total_claimed && item.total_approved ? 
        Number((Number(item.total_approved) / Number(item.total_claimed) * 100).toFixed(2)) : 0;
      return {
        providerId: item.insurance_provider_id,
        providerName: provider ? provider.name : 'Unknown',
        claimCount: Number(item.count),
        claimAmount: Number(item.total_claimed) || 0,
        approvedAmount: Number(item.total_approved) || 0,
        approvalRate,
      };
    });

    // Enrich status data
    const statusData = claimsByStatus.map((item) => ({
      status: item.status,
      claimCount: Number(item.count),
      claimAmount: Number(item.total_claimed) || 0,
      approvedAmount: Number(item.total_approved) || 0,
    }));

    // Calculate overall statistics
    const totalClaims = statusData.reduce((sum: number, item) => sum + item.claimCount, 0);
    const totalClaimAmount = statusData.reduce((sum: number, item) => sum + item.claimAmount, 0);
    const totalApprovedAmount = statusData.reduce((sum: number, item) => sum + item.approvedAmount, 0);

    return {
      headers: ['status', 'claimCount', 'claimAmount', 'approvedAmount'],
      data: statusData,
      meta: {
        totalClaims,
        totalClaimAmount,
        totalApprovedAmount,
        overallApprovalRate: totalClaimAmount > 0 ? Number((totalApprovedAmount / totalClaimAmount * 100).toFixed(2)) : 0,
      },
    };
  }

  /**
   * Export report data to CSV format
   * @param reportData The report data to export
   * @returns CSV string representation of the report
   */
  private exportReportToCsv(reportData: any): string {
    try {
      if (!reportData || !reportData.data || !Array.isArray(reportData.data)) {
        throw new InternalServerErrorException('Invalid report data for CSV export');
      }

      const { headers, data } = reportData;

      // Build CSV content
      let csv = headers.join(',') + '\n';

      // Add data rows
      for (const row of data) {
        const values = headers.map((header: string) => {
          const value = row[header];

          // Format value for CSV
          if (value === null || value === undefined) {
            return '';
          } else if (typeof value === 'string') {
            // Escape quotes and wrap in quotes
            return `"${value.replace(/"/g, '""')}"`;
          } else if (value instanceof Date) {
            return `"${value.toISOString()}"`;
          } else if (typeof value === 'object') {
            // Stringify objects but escape quotes
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }

          return value;
        });

        csv += values.join(',') + '\n';
      }

      return csv;
    } catch (error: unknown) {
      if (error instanceof Error) {
        Logger.error(`Error in exportReportToCsv: ${error.message}`, error.stack);
      } else {
        Logger.error(`Unknown error in exportReportToCsv`, String(error));
      }
      throw new InternalServerErrorException('Failed to export report to CSV');
    }
  }
}
