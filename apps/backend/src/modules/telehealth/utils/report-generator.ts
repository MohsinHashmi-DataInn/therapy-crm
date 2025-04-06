import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { TelehealthAnalyticsService } from '../services/telehealth-analytics.service';
import { TelehealthException } from '../exceptions/telehealth.exception';

/**
 * Service for generating telehealth analytics reports in various formats
 */
@Injectable()
export class ReportGeneratorService {
  constructor(private readonly analyticsService: TelehealthAnalyticsService) {}

  /**
   * Generate an Excel report of telehealth analytics for a specific date range
   * @param startDate Start date for analytics period
   * @param endDate End date for analytics period
   * @param providerId Optional provider ID to filter results
   * @param res Express response object for sending the file
   */
  async generateExcelReport(
    startDate: Date,
    endDate: Date,
    providerId?: bigint,
    res?: Response,
  ): Promise<Buffer | void> {
    try {
      // Get analytics data
      const analytics = await this.analyticsService.getSessionAnalytics(
        startDate,
        endDate
      );
      
      // Filter by provider if specified
      if (providerId) {
        // Apply provider filtering logic here if needed
      }

      // Create a new Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Therapy CRM';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Add overview sheet
      const overviewSheet = workbook.addWorksheet('Overview');
      overviewSheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      // Add summary data
      overviewSheet.addRows([
        { metric: 'Report Period', value: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}` },
        { metric: 'Total Sessions', value: analytics.sessionCounts.total },
        { metric: 'Completed Sessions', value: analytics.sessionCounts.byStatus.COMPLETED || 0 },
        { metric: 'Cancelled Sessions', value: analytics.sessionCounts.byStatus.CANCELLED || 0 },
        { metric: 'In Progress Sessions', value: analytics.sessionCounts.byStatus.IN_PROGRESS || 0 },
        { metric: 'Scheduled Sessions', value: analytics.sessionCounts.byStatus.SCHEDULED || 0 },
        { metric: 'Average Session Duration (min)', value: analytics.durations.averageActualDuration },
        { metric: 'Average Scheduled Duration (min)', value: analytics.durations.averageScheduledDuration },
      ]);

      // Style the overview sheet
      overviewSheet.getRow(1).font = { bold: true };
      overviewSheet.getColumn('metric').font = { bold: true };

      // Add provider sheet if provider data exists
      if (analytics.providers.length > 0) {
        const providerSheet = workbook.addWorksheet('Provider Performance');
        providerSheet.columns = [
          { header: 'Provider ID', key: 'providerId', width: 15 },
          { header: 'Provider Name', key: 'providerName', width: 30 },
          { header: 'Session Count', key: 'sessionCount', width: 15 },
        ];

        // Add provider data
        providerSheet.addRows(analytics.providers);

        // Style the provider sheet
        providerSheet.getRow(1).font = { bold: true };
      }

      // If response object is provided, send file directly
      if (res) {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=telehealth-analytics-${new Date().toISOString().split('T')[0]}.xlsx`,
        );

        return workbook.xlsx.write(res);
      }

      // Otherwise return the buffer
      return workbook.xlsx.writeBuffer() as Promise<Buffer>;
    } catch (error) {
      throw TelehealthException.reportGenerationFailed(error.message);
    }
  }

  /**
   * Generate a CSV report of telehealth sessions for a specific date range
   * @param startDate Start date for analytics period
   * @param endDate End date for analytics period
   * @param providerId Optional provider ID to filter results
   * @param res Express response object for sending the file
   */
  async generateCsvReport(
    startDate: Date,
    endDate: Date,
    providerId?: bigint,
    res?: Response,
  ): Promise<string | void> {
    try {
      // Get detailed session data
      const sessions = await this.analyticsService.getDetailedSessionsData(
        startDate,
        endDate,
        providerId,
      );

      // CSV Header
      let csv = 'Session ID,Title,Status,Scheduled Start,Scheduled End,Actual Start,Actual End,Provider ID,Duration (min)\n';

      // Add rows for each session
      for (const session of sessions) {
        const actualDuration = session.actualStart && session.actualEnd
          ? Math.round((new Date(session.actualEnd).getTime() - new Date(session.actualStart).getTime()) / 60000)
          : '';
        
        csv += `${session.id},`;
        csv += `"${session.title.replace(/"/g, '""')}",`;
        csv += `${session.status},`;
        csv += `${new Date(session.scheduledStart).toISOString()},`;
        csv += `${new Date(session.scheduledEnd).toISOString()},`;
        csv += `${session.actualStart ? new Date(session.actualStart).toISOString() : ''},`;
        csv += `${session.actualEnd ? new Date(session.actualEnd).toISOString() : ''},`;
        csv += `${session.providerId},`;
        csv += `${actualDuration}\n`;
      }

      // If response object is provided, send file directly
      if (res) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=telehealth-sessions-${new Date().toISOString().split('T')[0]}.csv`,
        );
        
        res.send(csv);
        return;
      }

      return csv;
    } catch (error) {
      throw TelehealthException.reportGenerationFailed(error.message);
    }
  }
}
