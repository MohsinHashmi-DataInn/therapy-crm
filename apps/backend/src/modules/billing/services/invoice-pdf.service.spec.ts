import { Test, TestingModule } from '@nestjs/testing';
import { InvoicePdfService } from './invoice-pdf.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path modules
jest.mock('fs', () => ({
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn(),
    pipe: jest.fn(),
  }),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  createReadStream: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/path/file.pdf'),
  basename: jest.fn().mockReturnValue('file.pdf'),
}));

// Mock PDFDocument
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    y: 100,
    page: { 
      width: 500,
      height: 700
    },
    switchToPage: jest.fn().mockReturnThis(),
    bufferedPageRange: jest.fn().mockReturnValue({ count: 1 }),
    heightOfString: jest.fn().mockReturnValue(10),
    end: jest.fn(),
  }));
});

describe('InvoicePdfService', () => {
  let service: InvoicePdfService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicePdfService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InvoicePdfService>(InvoicePdfService);
    prismaService = module.get(PrismaService) as DeepMockProxy<PrismaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateInvoicePdf', () => {
    it('should generate a PDF for a valid invoice', async () => {
      // Mock data
      const invoiceId = BigInt(1);
      const mockInvoice = {
        id: invoiceId,
        invoiceNumber: 'INV-001',
        issueDate: new Date(),
        dueDate: new Date(),
        status: 'SENT',
        notes: 'Test notes',
        totalAmount: 100.50,
        amountPaid: 0,
        discount: 0,
        tax: 0,
        clientId: BigInt(1),
        client: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: '123 Main St',
        },
        items: [
          {
            id: BigInt(1),
            description: 'Therapy Session',
            quantity: 1,
            rate: 100.50,
            amount: 100.50,
            serviceDate: new Date(),
            serviceCode: {
              code: 'T1001',
              name: 'Therapy',
            },
          },
        ],
        payments: [],
        insuranceClaims: [],
      };

      // Mock fs.createWriteStream to trigger 'finish' event
      const mockStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            callback();
          }
          return mockStream;
        }),
        pipe: jest.fn(),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockStream);

      // Mock prisma response
      prismaService.invoices.findUnique.mockResolvedValue(mockInvoice as any);

      // Call method
      const result = await service.generateInvoicePdf(invoiceId);

      // Assertions
      expect(prismaService.invoices.findUnique).toHaveBeenCalledWith({
        where: { id: invoiceId },
        include: {
          client: true,
          items: {
            include: {
              serviceCode: true,
            },
          },
          insuranceClaims: {
            include: {
              insuranceProvider: true,
            },
          },
          payments: true,
        },
      });

      expect(fs.createWriteStream).toHaveBeenCalled();
      expect(result).toBe('/mock/path/file.pdf');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      // Mock data
      const invoiceId = BigInt(1);

      // Mock prisma response
      prismaService.invoices.findUnique.mockResolvedValue(null);

      // Assertions
      await expect(service.generateInvoicePdf(invoiceId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('getInvoicePdfUrl', () => {
    it('should return a URL for the generated PDF', async () => {
      // Mock data
      const invoiceId = BigInt(1);
      
      // Mock generateInvoicePdf to return a file path
      jest.spyOn(service, 'generateInvoicePdf').mockResolvedValue('/mock/path/invoice_123.pdf');
      
      // Mock path.basename
      (path.basename as jest.Mock).mockReturnValue('invoice_123.pdf');
      
      // Call method
      const result = await service.getInvoicePdfUrl(invoiceId);
      
      // Assertions
      expect(service.generateInvoicePdf).toHaveBeenCalledWith(invoiceId);
      expect(result).toBe('/uploads/invoice_123.pdf');
    });
  });
});
