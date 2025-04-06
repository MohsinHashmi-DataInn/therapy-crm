import { Test, TestingModule } from '@nestjs/testing';
import { BillingReportsService } from './billing-reports.service';
import { ReportType } from '../enums/report-type.enum';
import { ReportPeriod } from '../enums/report-period.enum';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { BadRequestException } from '@nestjs/common';

describe('BillingReportsService', () => {
  let service: BillingReportsService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BillingReportsService>(BillingReportsService);
    prismaService = module.get(PrismaService) as DeepMockProxy<PrismaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate a REVENUE_BY_PERIOD report', async () => {
      // Mock data
      const reportType = ReportType.REVENUE_BY_PERIOD;
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-03-31');
      const period = ReportPeriod.MONTHLY;
      
      // Mock the raw query result
      const mockRevenueData = [
        { period: '2025-01', revenue: '1000.00', paymentCount: '10' },
        { period: '2025-02', revenue: '1500.00', paymentCount: '15' },
        { period: '2025-03', revenue: '2000.00', paymentCount: '20' },
      ];
      
      // Mock prisma raw query
      prismaService.$queryRaw.mockResolvedValue(mockRevenueData);
      
      // Call method
      const result = await service.generateReport(reportType, { startDate, endDate, period });
      
      // Assertions
      expect(result).toEqual(expect.objectContaining({
        reportType: ReportType.REVENUE_BY_PERIOD,
        data: mockRevenueData,
        summary: expect.objectContaining({
          totalRevenue: 4500,
          totalPayments: 45,
          periodCount: 3,
        }),
      }));
    });

    it('should generate a REVENUE_BY_SERVICE report', async () => {
      // Mock data
      const reportType = ReportType.REVENUE_BY_SERVICE;
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-03-31');
      
      // Mock the raw query result
      const mockServiceData = [
        { serviceCode: 'T1001', serviceName: 'Therapy Session', billed: '3000.00', collected: '2500.00' },
        { serviceCode: 'T1002', serviceName: 'Assessment', billed: '1500.00', collected: '1200.00' },
      ];
      
      // Mock prisma raw query
      prismaService.$queryRaw.mockResolvedValue(mockServiceData);
      
      // Call method
      const result = await service.generateReport(reportType, { startDate, endDate });
      
      // Assertions
      expect(result).toEqual(expect.objectContaining({
        reportType: ReportType.REVENUE_BY_SERVICE,
        data: mockServiceData,
        summary: expect.objectContaining({
          totalBilled: 4500,
          totalCollected: 3700,
          serviceCount: 2,
        }),
      }));
    });

    it('should generate an OUTSTANDING_INVOICES report', async () => {
      // Mock data
      const reportType = ReportType.OUTSTANDING_INVOICES;
      const limit = 10;
      
      // Mock invoice data
      const mockInvoices = [
        {
          id: BigInt(1),
          invoiceNumber: 'INV-001',
          issueDate: new Date('2025-01-01'),
          dueDate: new Date('2025-01-15'),
          status: 'SENT',
          totalAmount: 100.50,
          amountPaid: 0,
          client: {
            id: BigInt(1),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
          },
          payments: [],
        },
        {
          id: BigInt(2),
          invoiceNumber: 'INV-002',
          issueDate: new Date('2025-01-05'),
          dueDate: new Date('2025-01-20'),
          status: 'PARTIALLY_PAID',
          totalAmount: 200.00,
          amountPaid: 100.00,
          client: {
            id: BigInt(2),
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '987-654-3210',
          },
          payments: [
            {
              id: BigInt(1),
              amount: 100.00,
              date: new Date('2025-01-10'),
              method: 'CREDIT_CARD',
            },
          ],
        },
      ];
      
      // Mock prisma findMany
      (prismaService as any).invoice.findMany.mockResolvedValue(mockInvoices as any);
      
      // Call method
      const result = await service.generateReport(reportType, { limit });
      
      // Assertions
      expect(result).toEqual(expect.objectContaining({
        reportType: ReportType.OUTSTANDING_INVOICES,
        data: expect.arrayContaining([
          expect.objectContaining({
            invoiceNumber: 'INV-001',
            amountDue: 100.50,
          }),
          expect.objectContaining({
            invoiceNumber: 'INV-002',
            amountDue: 100.00,
          }),
        ]),
        summary: expect.objectContaining({
          totalInvoices: 2,
          totalOutstanding: 200.50,
        }),
      }));
    });

    it('should generate a PAYMENT_COLLECTION report', async () => {
      // Mock data
      const reportType = ReportType.PAYMENT_COLLECTION;
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-03-31');
      const period = ReportPeriod.MONTHLY;
      
      // Mock the raw query result
      const mockCollectionData = [
        { 
          period: '2025-01', 
          totalBilled: '2000.00', 
          totalCollected: '1800.00', 
          invoiceCount: '20',
          avgDaysToPayment: '15.5'
        },
        { 
          period: '2025-02', 
          totalBilled: '2500.00', 
          totalCollected: '2000.00', 
          invoiceCount: '25',
          avgDaysToPayment: '14.2'
        },
        { 
          period: '2025-03', 
          totalBilled: '3000.00', 
          totalCollected: '2200.00', 
          invoiceCount: '30',
          avgDaysToPayment: '16.8'
        },
      ];
      
      // Mock prisma raw query
      prismaService.$queryRaw.mockResolvedValue(mockCollectionData);
      
      // Call method
      const result = await service.generateReport(reportType, { startDate, endDate, period });
      
      // Assertions
      expect(result).toEqual(expect.objectContaining({
        reportType: ReportType.PAYMENT_COLLECTION,
        data: expect.arrayContaining([
          expect.objectContaining({
            period: '2025-01',
            collectionRate: 90,
          }),
          expect.objectContaining({
            period: '2025-02',
            collectionRate: 80,
          }),
          expect.objectContaining({
            period: '2025-03',
            collectionRate: 73.33,
          }),
        ]),
        summary: expect.objectContaining({
          totalBilled: 7500,
          totalCollected: 6000,
          overallCollectionRate: 80,
        }),
      }));
    });

    it('should throw BadRequestException for an unsupported report type', async () => {
      // Mock an invalid report type
      const reportType = 'INVALID_REPORT' as ReportType;
      
      // Assertions
      await expect(service.generateReport(reportType, {}))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('exportReportToCsv', () => {
    it('should convert report data to CSV format', () => {
      // Mock report data
      const reportData = {
        reportType: ReportType.REVENUE_BY_PERIOD,
        data: [
          { period: '2025-01', revenue: 1000, paymentCount: 10 },
          { period: '2025-02', revenue: 1500, paymentCount: 15 },
          { period: '2025-03', revenue: 2000, paymentCount: 20 },
        ],
      };
      
      // Call method
      // Access private method using type assertion
      const result = (service as any).exportReportToCsv(reportData);
      
      // Assertions
      expect(result).toContain('period,revenue,paymentCount');
      expect(result).toContain('2025-01,1000,10');
      expect(result).toContain('2025-02,1500,15');
      expect(result).toContain('2025-03,2000,20');
    });

    it('should throw BadRequestException for invalid report data', () => {
      // Assertions
      expect(() => (service as any).exportReportToCsv(null))
        .toThrow(BadRequestException);
      
      expect(() => (service as any).exportReportToCsv({ reportType: ReportType.REVENUE_BY_PERIOD }))
        .toThrow(BadRequestException);
      
      expect(() => (service as any).exportReportToCsv({ reportType: ReportType.REVENUE_BY_PERIOD, data: 'not-an-array' }))
        .toThrow(BadRequestException);
    });

    it('should handle special characters and different data types', () => {
      // Mock report data with different data types and special characters
      const reportData = {
        reportType: ReportType.OUTSTANDING_INVOICES,
        data: [
          { 
            invoiceNumber: 'INV-001', 
            client: 'John "Doe"', // String with quotes
            amount: 100.50, // Number
            dueDate: new Date('2025-01-15'), // Date
            notes: null, // Null value
            details: { status: 'overdue' }, // Object
          },
        ],
      };
      
      // Call method
      // Access private method using type assertion
      const result = (service as any).exportReportToCsv(reportData);
      
      // Assertions
      expect(result).toContain('invoiceNumber,client,amount,dueDate,notes,details');
      expect(result).toContain('INV-001,"John ""Doe"""'); // Quotes should be escaped
      expect(result).toContain('100.5');
      expect(result).toContain('"2025-01-15');
      expect(result).toContain(',"","{""status"":""overdue""}"');
    });
  });
});
