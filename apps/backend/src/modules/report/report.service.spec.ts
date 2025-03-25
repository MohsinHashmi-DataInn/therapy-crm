import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportType, ReportFormat } from './dto/report.dto';
import { AppointmentStatus, AttendanceStatus } from '@prisma/client';

describe('ReportService', () => {
  let service: ReportService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    appointment: {
      findMany: jest.fn(),
    },
    attendanceRecord: {
      findMany: jest.fn(),
    },
    waitlistEntry: {
      findMany: jest.fn(),
    },
    client: {
      findMany: jest.fn(),
    },
    communication: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate a daily schedule report', async () => {
      const mockAppointments = [
        {
          id: '1',
          startTime: new Date('2023-01-01T09:00:00Z'),
          endTime: new Date('2023-01-01T10:00:00Z'),
          status: AppointmentStatus.CONFIRMED,
          client: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
          },
          learner: {
            id: '1',
            firstName: 'Jane',
            lastName: 'Doe',
          },
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.generateReport({
        type: ReportType.DAILY_SCHEDULE,
        format: ReportFormat.JSON,
        startDate: '2023-01-01',
      });

      expect(result).toEqual(mockAppointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalled();
    });

    it('should generate an upcoming appointments report', async () => {
      const mockAppointments = [
        {
          id: '1',
          startTime: new Date('2023-01-01T09:00:00Z'),
          endTime: new Date('2023-01-01T10:00:00Z'),
          status: AppointmentStatus.CONFIRMED,
          client: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
          },
          learner: {
            id: '1',
            firstName: 'Jane',
            lastName: 'Doe',
          },
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.generateReport({
        type: ReportType.UPCOMING_APPOINTMENTS,
        format: ReportFormat.JSON,
      });

      expect(result).toEqual(mockAppointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalled();
    });

    it('should generate an attendance rates report', async () => {
      const mockAttendanceRecords = [
        {
          id: '1',
          status: AttendanceStatus.PRESENT,
          recordedAt: new Date(),
          learner: {
            id: '1',
            firstName: 'Jane',
            lastName: 'Doe',
          },
          appointment: {
            id: '1',
            startTime: new Date(),
          },
        },
        {
          id: '2',
          status: AttendanceStatus.ABSENT,
          recordedAt: new Date(),
          learner: {
            id: '2',
            firstName: 'John',
            lastName: 'Smith',
          },
          appointment: {
            id: '2',
            startTime: new Date(),
          },
        },
      ];

      mockPrismaService.attendanceRecord.findMany.mockResolvedValue(mockAttendanceRecords);

      const result = await service.generateReport({
        type: ReportType.ATTENDANCE_RATES,
        format: ReportFormat.JSON,
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      });

      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('present', 1);
      expect(result).toHaveProperty('absent', 1);
      expect(result).toHaveProperty('presentRate', 50);
      expect(prismaService.attendanceRecord.findMany).toHaveBeenCalled();
    });

    it('should throw an error for unsupported report type', async () => {
      await expect(
        service.generateReport({
          type: 'INVALID_TYPE' as any,
          format: ReportFormat.JSON,
        }),
      ).rejects.toThrow('Unsupported report type: INVALID_TYPE');
    });

    it('should format report as CSV when requested', async () => {
      const mockAppointments = [
        {
          id: '1',
          startTime: new Date('2023-01-01T09:00:00Z'),
          status: AppointmentStatus.CONFIRMED,
          client: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.generateReport({
        type: ReportType.DAILY_SCHEDULE,
        format: ReportFormat.CSV,
        startDate: '2023-01-01',
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('id,startTime,status,client_firstName,client_lastName');
      expect(result).toContain('1,2023-01-01T09:00:00.000Z,CONFIRMED,John,Doe');
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data with counts and top items', async () => {
      const mockAppointments = [{ id: '1' }, { id: '2' }];
      const mockFollowUps = [{ id: '1' }, { id: '2' }];
      const mockWaitlist = [{ id: '1' }, { id: '2' }];
      const mockAttendanceStats = {
        total: 10,
        present: 8,
        absent: 2,
        presentRate: 80,
        absentRate: 20,
      };

      mockPrismaService.appointment.findMany.mockResolvedValueOnce(mockAppointments);
      mockPrismaService.waitlistEntry.findMany.mockResolvedValueOnce(mockFollowUps);
      mockPrismaService.appointment.findMany.mockResolvedValueOnce(mockAppointments);
      mockPrismaService.waitlistEntry.findMany.mockResolvedValueOnce(mockWaitlist);
      mockPrismaService.attendanceRecord.findMany.mockResolvedValueOnce([
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
      ]);

      const result = await service.getDashboardData({});

      expect(result).toHaveProperty('upcomingAppointmentsCount', 2);
      expect(result).toHaveProperty('pendingFollowUpsCount', 2);
      expect(result).toHaveProperty('todayAppointmentsCount', 2);
      expect(result).toHaveProperty('waitlistCount', 2);
      expect(result).toHaveProperty('upcomingAppointments');
      expect(result).toHaveProperty('pendingFollowUps');
      expect(result).toHaveProperty('todaySchedule');
      expect(result).toHaveProperty('attendanceStats');
    });
  });

  describe('getUpcomingAppointments', () => {
    it('should return upcoming appointments for the next 7 days by default', async () => {
      const mockAppointments = [
        {
          id: '1',
          startTime: new Date('2023-01-01T09:00:00Z'),
          status: AppointmentStatus.CONFIRMED,
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getUpcomingAppointments();

      expect(result).toEqual(mockAppointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
            },
          }),
          orderBy: {
            startTime: 'asc',
          },
        }),
      );
    });

    it('should filter by clientId when provided', async () => {
      const clientId = '123';
      const mockAppointments = [
        {
          id: '1',
          clientId,
          startTime: new Date('2023-01-01T09:00:00Z'),
          status: AppointmentStatus.CONFIRMED,
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getUpcomingAppointments(7, clientId);

      expect(result).toEqual(mockAppointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId,
          }),
        }),
      );
    });
  });

  describe('getPendingFollowUps', () => {
    it('should return waitlist entries with pending follow-ups', async () => {
      const mockFollowUps = [
        {
          id: '1',
          followUpDate: new Date('2023-01-01'),
          priority: 'HIGH',
        },
      ];

      mockPrismaService.waitlistEntry.findMany.mockResolvedValue(mockFollowUps);

      const result = await service.getPendingFollowUps();

      expect(result).toEqual(mockFollowUps);
      expect(prismaService.waitlistEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            followUpDate: {
              lte: expect.any(Date),
            },
          }),
          orderBy: [
            { priority: 'asc' },
            { followUpDate: 'asc' },
          ],
        }),
      );
    });
  });

  describe('getLearnersSchedule', () => {
    it('should return appointments for learners on a specific date', async () => {
      const mockAppointments = [
        {
          id: '1',
          startTime: new Date('2023-01-01T09:00:00Z'),
          learnerId: '1',
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getLearnersSchedule('2023-01-01');

      expect(result).toEqual(mockAppointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
            learnerId: {
              not: null,
            },
          }),
        }),
      );
    });

    it('should filter by learnerId when provided', async () => {
      const learnerId = '123';
      const mockAppointments = [
        {
          id: '1',
          startTime: new Date('2023-01-01T09:00:00Z'),
          learnerId,
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getLearnersSchedule('2023-01-01', learnerId);

      expect(result).toEqual(mockAppointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            learnerId,
          }),
        }),
      );
    });
  });

  describe('getAttendanceRates', () => {
    it('should calculate attendance statistics correctly', async () => {
      const mockAttendanceRecords = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.NO_SHOW },
      ];

      mockPrismaService.attendanceRecord.findMany.mockResolvedValue(mockAttendanceRecords);

      const result = await service.getAttendanceRates('2023-01-01', '2023-01-31');

      expect(result.total).toBe(5);
      expect(result.present).toBe(2);
      expect(result.absent).toBe(1);
      expect(result.late).toBe(1);
      expect(result.noShow).toBe(1);
      expect(result.presentRate).toBe(40);
      expect(result.absentRate).toBe(20);
      expect(result.lateRate).toBe(20);
      expect(result.noShowRate).toBe(20);
    });

    it('should handle empty attendance records', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceRates('2023-01-01', '2023-01-31');

      expect(result.total).toBe(0);
      expect(result.present).toBe(0);
      expect(result.presentRate).toBe(0);
    });
  });

  describe('getCancellationPatterns', () => {
    it('should calculate cancellation statistics correctly', async () => {
      const mockCancelledAppointments = [
        { 
          id: '1', 
          status: AppointmentStatus.CANCELLED, 
          startTime: new Date('2023-01-01T09:00:00Z') 
        },
        { 
          id: '2', 
          status: AppointmentStatus.NO_SHOW, 
          startTime: new Date('2023-01-02T10:00:00Z') 
        },
        { 
          id: '3', 
          status: AppointmentStatus.RESCHEDULED, 
          startTime: new Date('2023-01-03T11:00:00Z') 
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(mockCancelledAppointments);

      const result = await service.getCancellationPatterns('2023-01-01', '2023-01-31');

      expect(result.total).toBe(3);
      expect(result.cancelled).toBe(1);
      expect(result.noShow).toBe(1);
      expect(result.rescheduled).toBe(1);
      expect(result.cancelledRate).toBe(33.33333333333333);
      expect(result.noShowRate).toBe(33.33333333333333);
      expect(result.rescheduledRate).toBe(33.33333333333333);
      expect(result.dayOfWeekDistribution).toBeDefined();
    });

    it('should handle empty cancellation records', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      const result = await service.getCancellationPatterns('2023-01-01', '2023-01-31');

      expect(result.total).toBe(0);
      expect(result.cancelled).toBe(0);
      expect(result.cancelledRate).toBe(0);
    });
  });
});
