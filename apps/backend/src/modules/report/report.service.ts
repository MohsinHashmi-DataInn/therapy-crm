import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GenerateReportDto, DashboardDataDto, ReportType, ReportFormat } from './dto/report.dto';
import { AppointmentStatus, AttendanceStatus, Prisma } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a report based on specified criteria
   * @param generateReportDto - Report generation options
   * @returns Report data in the requested format
   */
  async generateReport(generateReportDto: GenerateReportDto) {
    const { type, format, startDate, endDate, clientId, learnerId, detailed } = generateReportDto;
    
    // Get the appropriate data based on report type
    let data: Record<string, any>;
    
    switch (type) {
      case ReportType.DAILY_SCHEDULE:
        data = await this.getDailySchedule(startDate);
        break;
      case ReportType.UPCOMING_APPOINTMENTS:
        data = await this.getUpcomingAppointments(7, clientId);
        break;
      case ReportType.CLIENT_ACTIVITY:
        data = await this.getClientActivity(clientId, startDate, endDate);
        break;
      case ReportType.ATTENDANCE_RATES:
        data = await this.getAttendanceRates(startDate, endDate, learnerId);
        break;
      case ReportType.CANCELLATION_PATTERNS:
        data = await this.getCancellationPatterns(startDate, endDate, clientId);
        break;
      case ReportType.WAITLIST_STATUS:
        data = await this.getWaitlistStatus();
        break;
      case ReportType.COMMUNICATION_HISTORY:
        data = await this.getCommunicationHistory(clientId, startDate, endDate);
        break;
      default:
        throw new BadRequestException(`Unsupported report type: ${type}`);
    }
    
    // Format the data based on the requested format
    return this.formatReportData(data, format);
  }

  /**
   * Get dashboard data for quick overview
   * @param dashboardDataDto - Dashboard data options
   * @returns Dashboard overview data
   */
  async getDashboardData(dashboardDataDto: DashboardDataDto) {
    const date = dashboardDataDto.date ? new Date(dashboardDataDto.date) : new Date();
    
    // Get upcoming appointments for the next 7 days
    const upcomingAppointments = await this.getUpcomingAppointments(7);
    
    // Get pending follow-ups
    const pendingFollowUps = await this.getPendingFollowUps();
    
    // Get today's schedule
    const todaySchedule = await this.getDailySchedule(date.toISOString());
    
    // Get waitlist status
    const waitlistStatus = await this.getWaitlistStatus();
    
    // Get attendance statistics
    const attendanceStats = await this.getAttendanceStatistics();
    
    return {
      upcomingAppointmentsCount: upcomingAppointments.length,
      pendingFollowUpsCount: pendingFollowUps.length,
      todayAppointmentsCount: todaySchedule.length,
      waitlistCount: waitlistStatus.length,
      upcomingAppointments: upcomingAppointments.slice(0, 5), // Top 5 upcoming
      pendingFollowUps: pendingFollowUps.slice(0, 5), // Top 5 follow-ups
      todaySchedule: todaySchedule.slice(0, 5), // Top 5 today's appointments
      attendanceStats,
    };
  }

  /**
   * Get upcoming appointments
   * @param days - Number of days to look ahead
   * @param clientId - Optional client ID to filter by
   * @returns List of upcoming appointments
   */
  async getUpcomingAppointments(days: number = 7, clientId?: string) {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    const where: Prisma.AppointmentWhereInput = {
      startTime: {
        gte: today,
        lte: endDate,
      },
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
    };
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    return this.prisma.appointment.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get pending follow-ups from waitlist
   * @returns List of waitlist entries with pending follow-ups
   */
  async getPendingFollowUps() {
    const today = new Date();
    
    return this.prisma.waitlistEntry.findMany({
      where: {
        followUpDate: {
          lte: today,
        },
      },
      orderBy: [
        { priority: 'asc' }, // HIGH first
        { followUpDate: 'asc' }, // Oldest follow-up date first
      ],
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Get learners schedule
   * @param date - Date for the schedule
   * @param learnerId - Optional learner ID to filter by
   * @returns List of appointments for learners
   */
  async getLearnersSchedule(date?: string, learnerId?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const where: Prisma.AppointmentWhereInput = {
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };
    
    if (learnerId) {
      where.learnerId = learnerId;
    } else {
      where.learnerId = {
        not: null,
      };
    }
    
    return this.prisma.appointment.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            course: true,
          },
        },
      },
    });
  }

  /**
   * Get attendance rates
   * @param startDate - Start date for the date range
   * @param endDate - End date for the date range
   * @param learnerId - Optional learner ID to filter by
   * @returns Attendance statistics
   */
  async getAttendanceRates(startDate?: string, endDate?: string, learnerId?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    
    const where: Prisma.AttendanceRecordWhereInput = {
      appointment: {
        startTime: {
          gte: start,
          lte: end,
        },
      },
    };
    
    if (learnerId) {
      where.learnerId = learnerId;
    }
    
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: true,
      },
    });
    
    // Calculate attendance statistics
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(record => record.status === AttendanceStatus.PRESENT).length;
    const absent = attendanceRecords.filter(record => record.status === AttendanceStatus.ABSENT).length;
    const late = attendanceRecords.filter(record => record.status === AttendanceStatus.LATE).length;
    const excused = attendanceRecords.filter(record => record.status === AttendanceStatus.EXCUSED).length;
    const noShow = attendanceRecords.filter(record => record.status === AttendanceStatus.NO_SHOW).length;
    
    return {
      total,
      present,
      absent,
      late,
      excused,
      noShow,
      presentRate: total > 0 ? (present / total) * 100 : 0,
      absentRate: total > 0 ? (absent / total) * 100 : 0,
      lateRate: total > 0 ? (late / total) * 100 : 0,
      excusedRate: total > 0 ? (excused / total) * 100 : 0,
      noShowRate: total > 0 ? (noShow / total) * 100 : 0,
      records: attendanceRecords,
    };
  }

  /**
   * Get cancellation patterns
   * @param startDate - Start date for the date range
   * @param endDate - End date for the date range
   * @param clientId - Optional client ID to filter by
   * @returns Cancellation statistics
   */
  async getCancellationPatterns(startDate?: string, endDate?: string, clientId?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    
    const where: Prisma.AppointmentWhereInput = {
      startTime: {
        gte: start,
        lte: end,
      },
      status: {
        in: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW, AppointmentStatus.RESCHEDULED],
      },
    };
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    const cancelledAppointments = await this.prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        statusHistory: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    // Calculate cancellation statistics
    const total = cancelledAppointments.length;
    const cancelled = cancelledAppointments.filter(app => app.status === AppointmentStatus.CANCELLED).length;
    const noShow = cancelledAppointments.filter(app => app.status === AppointmentStatus.NO_SHOW).length;
    const rescheduled = cancelledAppointments.filter(app => app.status === AppointmentStatus.RESCHEDULED).length;
    
    // Group by day of week
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    cancelledAppointments.forEach(app => {
      const dayOfWeek = new Date(app.startTime).getDay();
      dayOfWeekCounts[dayOfWeek]++;
    });
    
    return {
      total,
      cancelled,
      noShow,
      rescheduled,
      cancelledRate: total > 0 ? (cancelled / total) * 100 : 0,
      noShowRate: total > 0 ? (noShow / total) * 100 : 0,
      rescheduledRate: total > 0 ? (rescheduled / total) * 100 : 0,
      dayOfWeekDistribution: {
        Sunday: dayOfWeekCounts[0],
        Monday: dayOfWeekCounts[1],
        Tuesday: dayOfWeekCounts[2],
        Wednesday: dayOfWeekCounts[3],
        Thursday: dayOfWeekCounts[4],
        Friday: dayOfWeekCounts[5],
        Saturday: dayOfWeekCounts[6],
      },
      appointments: cancelledAppointments,
    };
  }

  /**
   * Get daily schedule
   * @param date - Date for the schedule
   * @returns List of appointments for the day
   */
  private async getDailySchedule(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get client activity
   * @param clientId - Client ID
   * @param startDate - Start date for the date range
   * @param endDate - End date for the date range
   * @returns Client activity data
   */
  private async getClientActivity(clientId?: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    
    const where: Prisma.ClientWhereInput = {};
    
    if (clientId) {
      where.id = clientId;
    }
    
    const clients = await this.prisma.client.findMany({
      where,
      include: {
        appointments: {
          where: {
            startTime: {
              gte: start,
              lte: end,
            },
          },
          include: {
            attendanceRecord: true,
          },
        },
        communications: {
          where: {
            sentAt: {
              gte: start,
              lte: end,
            },
          },
        },
        learners: true,
      },
    });
    
    return clients.map(client => {
      const totalAppointments = client.appointments.length;
      const completedAppointments = client.appointments.filter(app => app.status === AppointmentStatus.COMPLETED).length;
      const cancelledAppointments = client.appointments.filter(app => app.status === AppointmentStatus.CANCELLED || app.status === AppointmentStatus.NO_SHOW).length;
      const communicationsCount = client.communications.length;
      
      return {
        client: {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
        },
        learners: client.learners.map(learner => ({
          id: learner.id,
          firstName: learner.firstName,
          lastName: learner.lastName,
        })),
        activitySummary: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          communicationsCount,
          completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
          cancellationRate: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
        },
        appointments: client.appointments,
        communications: client.communications,
      };
    });
  }

  /**
   * Get waitlist status
   * @returns Waitlist status data
   */
  private async getWaitlistStatus() {
    return this.prisma.waitlistEntry.findMany({
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Get communication history
   * @param clientId - Client ID
   * @param startDate - Start date for the date range
   * @param endDate - End date for the date range
   * @returns Communication history data
   */
  private async getCommunicationHistory(clientId?: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    
    const where: Prisma.CommunicationWhereInput = {
      sentAt: {
        gte: start,
        lte: end,
      },
    };
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    return this.prisma.communication.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });
  }

  /**
   * Get attendance statistics
   * @returns Attendance statistics
   */
  private async getAttendanceStatistics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        recordedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });
    
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(record => record.status === AttendanceStatus.PRESENT).length;
    const absent = attendanceRecords.filter(record => record.status === AttendanceStatus.ABSENT).length;
    const late = attendanceRecords.filter(record => record.status === AttendanceStatus.LATE).length;
    const noShow = attendanceRecords.filter(record => record.status === AttendanceStatus.NO_SHOW).length;
    
    return {
      total,
      present,
      absent,
      late,
      noShow,
      presentRate: total > 0 ? (present / total) * 100 : 0,
      absentRate: total > 0 ? (absent / total) * 100 : 0,
      lateRate: total > 0 ? (late / total) * 100 : 0,
      noShowRate: total > 0 ? (noShow / total) * 100 : 0,
    };
  }

  /**
   * Format report data based on requested format
   * @param data - Report data
   * @param format - Requested format
   * @returns Formatted report data
   */
  private formatReportData(data: any, format: ReportFormat) {
    switch (format) {
      case ReportFormat.JSON:
        return data;
      case ReportFormat.CSV:
        return this.convertToCSV(data);
      case ReportFormat.EXCEL:
        // In a real implementation, this would use a library like exceljs
        // For now, we'll return CSV as a placeholder
        return this.convertToCSV(data);
      case ReportFormat.PDF:
        // In a real implementation, this would use a library like PDFKit
        // For now, we'll return JSON as a placeholder
        return data;
      default:
        return data;
    }
  }

  /**
   * Convert data to CSV format
   * @param data - Data to convert
   * @returns CSV string
   */
  private convertToCSV(data: any[]): string {
    if (!data || !data.length) {
      return '';
    }
    
    // Get headers from first object
    const headers = Object.keys(this.flattenObject(data[0]));
    
    // Create CSV header row
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
      const flatItem = this.flattenObject(item);
      const row = headers.map(header => {
        const value = flatItem[header];
        // Handle values with commas by wrapping in quotes
        return value !== undefined && value !== null 
          ? typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
          : '';
      }).join(',');
      csv += row + '\n';
    });
    
    return csv;
  }

  /**
   * Flatten a nested object for CSV conversion
   * @param obj - Object to flatten
   * @param prefix - Prefix for nested keys
   * @returns Flattened object
   */
  private flattenObject(obj: any, prefix: string = ''): any {
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
          // Recursively flatten nested objects
          Object.assign(result, this.flattenObject(value, newKey));
        } else if (value instanceof Date) {
          // Format dates
          result[newKey] = value.toISOString();
        } else if (Array.isArray(value)) {
          // Skip arrays for simplicity
          result[newKey] = JSON.stringify(value);
        } else {
          result[newKey] = value;
        }
      }
    }
    
    return result;
  }
}
