import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateBillingDto } from './dto/update-billing.dto';

const mockPrismaService = {
  practice: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockPracticeId = BigInt(1);
const mockBillingData = {
  id: mockPracticeId,
  billingName: 'Test Practice Billing',
  billingEmail: 'billing@test.com',
  billingAddress: '123 Test St',
  billingCity: 'Testville',
  billingState: 'TS',
  billingZipCode: '12345',
  name: 'Test Practice',
  email: 'main@test.com',
  phone: '123-456-7890',
  address: '1 Main St',
  city: 'Mainville',
  state: 'MS',
  zipCode: '54321',
  subscriptionPlan: 'professional',
  subscriptionStatus: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BillingService', () => {
  let service: BillingService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get(PrismaService);
    (service as any).practiceId = mockPracticeId;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBillingInfo', () => {
    it('should return billing info if practice exists', async () => {
      prisma.practice.findUnique.mockResolvedValue(mockBillingData);

      const result = await service.getBillingInfo();

      expect(result).toEqual({
        billingName: mockBillingData.billingName,
        billingEmail: mockBillingData.billingEmail,
        billingAddress: mockBillingData.billingAddress,
        billingCity: mockBillingData.billingCity,
        billingState: mockBillingData.billingState,
        billingZipCode: mockBillingData.billingZipCode,
      });
      expect(prisma.practice.findUnique).toHaveBeenCalledWith({
        where: { id: mockPracticeId },
        select: {
          billingName: true,
          billingEmail: true,
          billingAddress: true,
          billingCity: true,
          billingState: true,
          billingZipCode: true,
        },
      });
    });

    it('should throw NotFoundException if practice does not exist', async () => {
      prisma.practice.findUnique.mockResolvedValue(null);

      await expect(service.getBillingInfo()).rejects.toThrow(NotFoundException);
      await expect(service.getBillingInfo()).rejects.toThrow('Practice record not found.');
      expect(prisma.practice.findUnique).toHaveBeenCalledWith({
        where: { id: mockPracticeId },
        select: {
          billingName: true,
          billingEmail: true,
          billingAddress: true,
          billingCity: true,
          billingState: true,
          billingZipCode: true,
        },
      });
    });
  });

  describe('updateBillingInfo', () => {
    const updateDto: UpdateBillingDto = {
      billingName: 'Updated Billing Name',
      billingEmail: 'updated.billing@test.com',
      billingAddress: '',
    };

    const expectedUpdateData = {
      billingName: updateDto.billingName,
      billingEmail: updateDto.billingEmail,
      billingAddress: updateDto.billingAddress,
    };

    const updatedPracticeData = { ...mockBillingData, ...expectedUpdateData };

    it('should update and return billing info if practice exists', async () => {
      prisma.practice.findUnique.mockResolvedValue(mockBillingData);
      prisma.practice.update.mockResolvedValue(updatedPracticeData);

      const result = await service.updateBillingInfo(updateDto);

      expect(result).toEqual({
        billingName: updatedPracticeData.billingName,
        billingEmail: updatedPracticeData.billingEmail,
        billingAddress: updatedPracticeData.billingAddress,
        billingCity: updatedPracticeData.billingCity,
        billingState: updatedPracticeData.billingState,
        billingZipCode: updatedPracticeData.billingZipCode,
      });
      expect(prisma.practice.update).toHaveBeenCalledWith({
        where: { id: mockPracticeId },
        data: expectedUpdateData,
        select: {
          billingName: true,
          billingEmail: true,
          billingAddress: true,
          billingCity: true,
          billingState: true,
          billingZipCode: true,
        },
      });
    });

    it('should throw NotFoundException if practice does not exist during update', async () => {
      const error = new Error('Record to update not found.') as any;
      error.code = 'P2025';
      prisma.practice.update.mockRejectedValue(error);

      await expect(service.updateBillingInfo(updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.updateBillingInfo(updateDto)).rejects.toThrow('Practice record not found for update.');
      expect(prisma.practice.update).toHaveBeenCalledWith({
        where: { id: mockPracticeId },
        data: expectedUpdateData,
        select: {
          billingName: true,
          billingEmail: true,
          billingAddress: true,
          billingCity: true,
          billingState: true,
          billingZipCode: true,
        },
      });
    });

    it('should handle unexpected errors during update', async () => {
      const genericError = new Error('Database connection lost');
      prisma.practice.update.mockRejectedValue(genericError);

      await expect(service.updateBillingInfo(updateDto)).rejects.toThrow(Error);
      await expect(service.updateBillingInfo(updateDto)).rejects.toThrow('Database connection lost');
    });
  });
});
