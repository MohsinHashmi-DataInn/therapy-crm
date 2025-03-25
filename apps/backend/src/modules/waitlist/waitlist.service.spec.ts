import { Test, TestingModule } from '@nestjs/testing';
import { WaitlistService } from './waitlist.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { WaitlistPriority, WaitlistStatus } from '@prisma/client';
import { CreateWaitlistEntryDto, UpdateWaitlistEntryDto } from './dto/waitlist.dto';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      findUnique: jest.fn(),
    },
    waitlistEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockClient = {
    id: 'client-id-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
  };

  const mockWaitlistEntry = {
    id: 'waitlist-id-1',
    clientId: 'client-id-1',
    priority: WaitlistPriority.MEDIUM,
    requestedService: 'Speech Therapy',
    notes: 'Initial inquiry',
    status: WaitlistStatus.WAITING,
    followUpDate: new Date('2025-04-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    client: mockClient,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WaitlistService>(WaitlistService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new waitlist entry', async () => {
      const createDto: CreateWaitlistEntryDto = {
        clientId: 'client-id-1',
        priority: WaitlistPriority.MEDIUM,
        requestedService: 'Speech Therapy',
        notes: 'Initial inquiry',
        status: WaitlistStatus.WAITING,
        followUpDate: '2025-04-01',
      };

      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.waitlistEntry.create.mockResolvedValue(mockWaitlistEntry);

      const result = await service.create(createDto);

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.clientId },
      });
      expect(mockPrismaService.waitlistEntry.create).toHaveBeenCalled();
      expect(result).toEqual(mockWaitlistEntry);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const createDto: CreateWaitlistEntryDto = {
        clientId: 'non-existent-client',
        priority: WaitlistPriority.MEDIUM,
      };

      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.clientId },
      });
      expect(mockPrismaService.waitlistEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all waitlist entries with filters', async () => {
      const filters = {
        priority: WaitlistPriority.HIGH,
        status: WaitlistStatus.WAITING,
        clientId: 'client-id-1',
        followUpFrom: '2025-03-01',
        followUpTo: '2025-04-30',
      };

      mockPrismaService.waitlistEntry.findMany.mockResolvedValue([mockWaitlistEntry]);

      const result = await service.findAll(filters);

      expect(mockPrismaService.waitlistEntry.findMany).toHaveBeenCalledWith({
        where: {
          priority: filters.priority,
          status: filters.status,
          clientId: filters.clientId,
          followUpDate: {
            gte: new Date(filters.followUpFrom),
            lte: new Date(filters.followUpTo),
          },
        },
        orderBy: { createdAt: 'desc' },
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
      expect(result).toEqual([mockWaitlistEntry]);
    });
  });

  describe('findOne', () => {
    it('should return a waitlist entry by id', async () => {
      mockPrismaService.waitlistEntry.findUnique.mockResolvedValue(mockWaitlistEntry);

      const result = await service.findOne('waitlist-id-1');

      expect(mockPrismaService.waitlistEntry.findUnique).toHaveBeenCalledWith({
        where: { id: 'waitlist-id-1' },
        include: {
          client: true,
        },
      });
      expect(result).toEqual(mockWaitlistEntry);
    });

    it('should throw NotFoundException if waitlist entry does not exist', async () => {
      mockPrismaService.waitlistEntry.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.waitlistEntry.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          client: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a waitlist entry', async () => {
      const updateDto: UpdateWaitlistEntryDto = {
        priority: WaitlistPriority.HIGH,
        status: WaitlistStatus.CONTACTED,
        followUpDate: '2025-04-15',
      };

      mockPrismaService.waitlistEntry.update.mockResolvedValue({
        ...mockWaitlistEntry,
        priority: WaitlistPriority.HIGH,
        status: WaitlistStatus.CONTACTED,
        followUpDate: new Date('2025-04-15'),
      });

      const result = await service.update('waitlist-id-1', updateDto);

      expect(mockPrismaService.waitlistEntry.update).toHaveBeenCalledWith({
        where: { id: 'waitlist-id-1' },
        data: {
          priority: updateDto.priority,
          status: updateDto.status,
          followUpDate: new Date(updateDto.followUpDate),
        },
        include: {
          client: true,
        },
      });
      expect(result.priority).toEqual(WaitlistPriority.HIGH);
      expect(result.status).toEqual(WaitlistStatus.CONTACTED);
    });

    it('should throw NotFoundException if waitlist entry does not exist', async () => {
      const updateDto: UpdateWaitlistEntryDto = {
        priority: WaitlistPriority.HIGH,
      };

      mockPrismaService.waitlistEntry.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should verify client exists when clientId is provided', async () => {
      const updateDto: UpdateWaitlistEntryDto = {
        clientId: 'new-client-id',
      };

      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.update('waitlist-id-1', updateDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: updateDto.clientId },
      });
      expect(mockPrismaService.waitlistEntry.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a waitlist entry', async () => {
      mockPrismaService.waitlistEntry.delete.mockResolvedValue(mockWaitlistEntry);

      const result = await service.remove('waitlist-id-1');

      expect(mockPrismaService.waitlistEntry.delete).toHaveBeenCalledWith({
        where: { id: 'waitlist-id-1' },
      });
      expect(result).toEqual(mockWaitlistEntry);
    });

    it('should throw NotFoundException if waitlist entry does not exist', async () => {
      mockPrismaService.waitlistEntry.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDueFollowUps', () => {
    it('should return waitlist entries with follow-ups due today or overdue', async () => {
      mockPrismaService.waitlistEntry.findMany.mockResolvedValue([mockWaitlistEntry]);
      
      const result = await service.getDueFollowUps();

      expect(mockPrismaService.waitlistEntry.findMany).toHaveBeenCalledWith({
        where: {
          followUpDate: {
            lte: expect.any(Date),
          },
          status: {
            not: WaitlistStatus.REMOVED,
          },
        },
        orderBy: [
          { priority: 'asc' },
          { followUpDate: 'asc' },
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
      expect(result).toEqual([mockWaitlistEntry]);
    });
  });

  describe('findByClient', () => {
    it('should return all waitlist entries for a client', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.waitlistEntry.findMany.mockResolvedValue([mockWaitlistEntry]);

      const result = await service.findByClient('client-id-1');

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'client-id-1' },
      });
      expect(mockPrismaService.waitlistEntry.findMany).toHaveBeenCalledWith({
        where: { clientId: 'client-id-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockWaitlistEntry]);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.findByClient('non-existent-client')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.waitlistEntry.findMany).not.toHaveBeenCalled();
    });
  });
});
