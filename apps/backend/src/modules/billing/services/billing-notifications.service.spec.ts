import { Test, TestingModule } from '@nestjs/testing';
import { BillingNotificationsService } from './billing-notifications.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { InvoiceStatus } from '../../../types/prisma-models';
import { ClaimStatus } from '../../../types/prisma-models';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('BillingNotificationsService', () => {
  let service: BillingNotificationsService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingNotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BillingNotificationsService>(BillingNotificationsService);
    prismaService = module.get(PrismaService) as DeepMockProxy<PrismaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendInvoiceCreatedNotification', () => {
    it('should create a notification for a new invoice', async () => {
      // Mock data
      const invoiceId = BigInt(1);
      const mockInvoice = {
        id: invoiceId,
        invoiceNumber: 'INV-001',
        totalAmount: 100.50,
        dueDate: new Date(),
        clientId: BigInt(1),
        client: {
          id: BigInt(1),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          preferredContactMethod: 'EMAIL',
        },
      };

      // Mock prisma response
      (prismaService as any).invoice.findUnique.mockResolvedValue(mockInvoice as any);
      (prismaService as any).notification.create.mockResolvedValue({} as any);

      // Call method
      await service.sendInvoiceCreatedNotification(invoiceId);

      // Assertions
      expect((prismaService as any).invoice.findUnique).toHaveBeenCalledWith({
        where: { id: invoiceId },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              preferredContactMethod: true,
            },
          },
        },
      });

      expect((prismaService as any).notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: mockInvoice.clientId.toString(),
          recipientType: 'CLIENT',
          title: 'New Invoice Available',
          type: 'INVOICE',
        }),
      });
    });

    it('should not create notification if invoice or client not found', async () => {
      // Mock data
      const invoiceId = BigInt(1);

      // Mock prisma response - invoice not found
      (prismaService as any).invoice.findUnique.mockResolvedValue(null);

      // Call method
      await service.sendInvoiceCreatedNotification(invoiceId);

      // Assertions
      expect((prismaService as any).notification.create).not.toHaveBeenCalled();
    });
  });

  describe('sendInvoiceOverdueNotification', () => {
    it('should create an overdue notification', async () => {
      // Mock data
      const invoiceId = BigInt(1);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 10); // 10 days overdue
      
      const mockInvoice = {
        id: invoiceId,
        invoiceNumber: 'INV-001',
        totalAmount: 100.50,
        dueDate,
        clientId: BigInt(1),
        client: {
          id: BigInt(1),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      // Mock prisma response
      (prismaService as any).invoice.findUnique.mockResolvedValue(mockInvoice as any);
      (prismaService as any).notification.create.mockResolvedValue({} as any);

      // Call method
      await service.sendInvoiceOverdueNotification(invoiceId);

      // Assertions
      expect((prismaService as any).notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: mockInvoice.clientId.toString(),
          recipientType: 'CLIENT',
          title: 'Invoice Overdue',
          priority: 'HIGH',
        }),
      });
    });
  });

  describe('sendClaimStatusUpdateNotification', () => {
    it('should create a notification when claim status changes to APPROVED', async () => {
      // Mock data
      const claimId = BigInt(1);
      const oldStatus = ClaimStatus.SUBMITTED;
      const newStatus = ClaimStatus.APPROVED;
      
      const mockClaim = {
        id: claimId,
        invoiceId: BigInt(1),
        status: newStatus,
        invoice: {
          id: BigInt(1),
          invoiceNumber: 'INV-001',
          clientId: BigInt(1),
          client: {
            id: BigInt(1),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        insuranceProvider: {
          id: BigInt(1),
          name: 'Test Insurance Co.',
        },
      };

      // Mock prisma response
      (prismaService as any).insuranceClaim.findUnique.mockResolvedValue(mockClaim as any);
      (prismaService as any).notification.create.mockResolvedValue({} as any);

      // Call method
      await service.sendClaimStatusUpdateNotification(claimId, oldStatus, newStatus);

      // Assertions
      expect((prismaService as any).notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Insurance Claim Approved',
          priority: 'HIGH',
        }),
      });
    });

    it('should create a notification when claim status changes to DENIED', async () => {
      // Mock data
      const claimId = BigInt(1);
      const oldStatus = ClaimStatus.SUBMITTED;
      const newStatus = ClaimStatus.DENIED;
      
      const mockClaim = {
        id: claimId,
        invoiceId: BigInt(1),
        status: newStatus,
        invoice: {
          id: BigInt(1),
          invoiceNumber: 'INV-001',
          clientId: BigInt(1),
          client: {
            id: BigInt(1),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        insuranceProvider: {
          id: BigInt(1),
          name: 'Test Insurance Co.',
        },
      };

      // Mock prisma response
      (prismaService as any).insuranceClaim.findUnique.mockResolvedValue(mockClaim as any);
      (prismaService as any).notification.create.mockResolvedValue({} as any);

      // Call method
      await service.sendClaimStatusUpdateNotification(claimId, oldStatus, newStatus);

      // Assertions
      expect((prismaService as any).notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Insurance Claim Denied',
          priority: 'HIGH',
        }),
      });
    });
  });

  describe('checkAndSendDueInvoiceReminders', () => {
    it('should send reminders for invoices due in 7, 3, and 1 days', async () => {
      // Mock current date
      const today = new Date();
      
      // Create mock invoices for each reminder day
      const mockInvoices = [
        { id: BigInt(1) },
        { id: BigInt(2) },
        { id: BigInt(3) },
      ];

      // Mock prisma response - different result for each call (7, 3, 1 days)
      (prismaService as any).invoice.findMany
        .mockResolvedValueOnce([mockInvoices[0]] as any)
        .mockResolvedValueOnce([mockInvoices[1]] as any)
        .mockResolvedValueOnce([mockInvoices[2]] as any);

      // Call method
      await service.checkAndSendDueInvoiceReminders();

      // Should have called findMany 3 times (for 7, 3, and 1 day reminders)
      expect((prismaService as any).invoice.findMany).toHaveBeenCalledTimes(3);
      
      // Should have attempted to send 3 reminders (one for each invoice)
      expect((prismaService as any).invoice.findUnique).toHaveBeenCalledTimes(3);
    });
  });
});
