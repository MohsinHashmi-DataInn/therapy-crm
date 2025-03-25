import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationService } from './communication.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommunicationType, CommunicationStatus } from '@prisma/client';
import { 
  CreateCommunicationDto, 
  UpdateCommunicationDto,
  CommunicationTemplateDto 
} from './dto/communication.dto';

describe('CommunicationService', () => {
  let service: CommunicationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      findUnique: jest.fn(),
    },
    communication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    communicationTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockClient = {
    id: 'client-id-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
  };

  const mockCommunication = {
    id: 'comm-id-1',
    clientId: 'client-id-1',
    type: CommunicationType.EMAIL,
    subject: 'Session Reminder',
    content: 'This is a reminder for your upcoming session.',
    sentAt: new Date(),
    status: CommunicationStatus.SENT,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: mockClient,
  };

  const mockTemplate = {
    id: 'template-id-1',
    name: 'session-reminder',
    subject: 'Reminder: {{sessionType}} Session',
    content: 'Hello {{clientName}}, this is a reminder for your {{sessionType}} session on {{date}}.',
    type: CommunicationType.EMAIL,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new communication log entry', async () => {
      const createDto: CreateCommunicationDto = {
        clientId: 'client-id-1',
        type: CommunicationType.EMAIL,
        subject: 'Session Reminder',
        content: 'This is a reminder for your upcoming session.',
        sentAt: new Date().toISOString(),
        status: CommunicationStatus.SENT,
      };

      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.communication.create.mockResolvedValue(mockCommunication);

      const result = await service.create(createDto);

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.clientId },
      });
      expect(mockPrismaService.communication.create).toHaveBeenCalled();
      expect(result).toEqual(mockCommunication);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const createDto: CreateCommunicationDto = {
        clientId: 'non-existent-client',
        type: CommunicationType.EMAIL,
        content: 'Test content',
      };

      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.clientId },
      });
      expect(mockPrismaService.communication.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all communications with filters', async () => {
      const filters = {
        type: CommunicationType.EMAIL,
        status: CommunicationStatus.SENT,
        clientId: 'client-id-1',
        startDate: '2025-03-01',
        endDate: '2025-04-30',
      };

      mockPrismaService.communication.findMany.mockResolvedValue([mockCommunication]);

      const result = await service.findAll(filters);

      expect(mockPrismaService.communication.findMany).toHaveBeenCalledWith({
        where: {
          type: filters.type,
          status: filters.status,
          clientId: filters.clientId,
          sentAt: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        },
        orderBy: { sentAt: 'desc' },
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
      expect(result).toEqual([mockCommunication]);
    });
  });

  describe('findOne', () => {
    it('should return a communication by id', async () => {
      mockPrismaService.communication.findUnique.mockResolvedValue(mockCommunication);

      const result = await service.findOne('comm-id-1');

      expect(mockPrismaService.communication.findUnique).toHaveBeenCalledWith({
        where: { id: 'comm-id-1' },
        include: {
          client: true,
        },
      });
      expect(result).toEqual(mockCommunication);
    });

    it('should throw NotFoundException if communication does not exist', async () => {
      mockPrismaService.communication.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.communication.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          client: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a communication', async () => {
      const updateDto: UpdateCommunicationDto = {
        subject: 'Updated Subject',
        status: CommunicationStatus.DELIVERED,
      };

      mockPrismaService.communication.update.mockResolvedValue({
        ...mockCommunication,
        subject: 'Updated Subject',
        status: CommunicationStatus.DELIVERED,
      });

      const result = await service.update('comm-id-1', updateDto);

      expect(mockPrismaService.communication.update).toHaveBeenCalledWith({
        where: { id: 'comm-id-1' },
        data: {
          subject: updateDto.subject,
          status: updateDto.status,
        },
        include: {
          client: true,
        },
      });
      expect(result.subject).toEqual('Updated Subject');
      expect(result.status).toEqual(CommunicationStatus.DELIVERED);
    });

    it('should throw NotFoundException if communication does not exist', async () => {
      const updateDto: UpdateCommunicationDto = {
        subject: 'Updated Subject',
      };

      mockPrismaService.communication.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should verify client exists when clientId is provided', async () => {
      const updateDto: UpdateCommunicationDto = {
        clientId: 'new-client-id',
      };

      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.update('comm-id-1', updateDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: updateDto.clientId },
      });
      expect(mockPrismaService.communication.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a communication', async () => {
      mockPrismaService.communication.delete.mockResolvedValue(mockCommunication);

      const result = await service.remove('comm-id-1');

      expect(mockPrismaService.communication.delete).toHaveBeenCalledWith({
        where: { id: 'comm-id-1' },
      });
      expect(result).toEqual(mockCommunication);
    });

    it('should throw NotFoundException if communication does not exist', async () => {
      mockPrismaService.communication.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByClient', () => {
    it('should return all communications for a client', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.communication.findMany.mockResolvedValue([mockCommunication]);

      const result = await service.findByClient('client-id-1');

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'client-id-1' },
      });
      expect(mockPrismaService.communication.findMany).toHaveBeenCalledWith({
        where: { clientId: 'client-id-1' },
        orderBy: { sentAt: 'desc' },
      });
      expect(result).toEqual([mockCommunication]);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.findByClient('non-existent-client')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.communication.findMany).not.toHaveBeenCalled();
    });
  });

  describe('createTemplate', () => {
    it('should create a new communication template', async () => {
      const templateDto: CommunicationTemplateDto = {
        name: 'session-reminder',
        subject: 'Reminder: {{sessionType}} Session',
        content: 'Hello {{clientName}}, this is a reminder for your {{sessionType}} session on {{date}}.',
        type: CommunicationType.EMAIL,
      };

      mockPrismaService.communicationTemplate.findUnique.mockResolvedValue(null);
      mockPrismaService.communicationTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(templateDto);

      expect(mockPrismaService.communicationTemplate.findUnique).toHaveBeenCalledWith({
        where: { name: templateDto.name },
      });
      expect(mockPrismaService.communicationTemplate.create).toHaveBeenCalledWith({
        data: templateDto,
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should throw BadRequestException if template with same name already exists', async () => {
      const templateDto: CommunicationTemplateDto = {
        name: 'existing-template',
        subject: 'Subject',
        content: 'Content',
        type: CommunicationType.EMAIL,
      };

      mockPrismaService.communicationTemplate.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.createTemplate(templateDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.communicationTemplate.create).not.toHaveBeenCalled();
    });
  });

  describe('getTemplates', () => {
    it('should return all communication templates', async () => {
      mockPrismaService.communicationTemplate.findMany.mockResolvedValue([mockTemplate]);

      const result = await service.getTemplates();

      expect(mockPrismaService.communicationTemplate.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockTemplate]);
    });
  });

  describe('getTemplateByName', () => {
    it('should return a template by name', async () => {
      mockPrismaService.communicationTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateByName('session-reminder');

      expect(mockPrismaService.communicationTemplate.findUnique).toHaveBeenCalledWith({
        where: { name: 'session-reminder' },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException if template does not exist', async () => {
      mockPrismaService.communicationTemplate.findUnique.mockResolvedValue(null);

      await expect(service.getTemplateByName('non-existent-template')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendTemplate', () => {
    it('should send a communication using a template with replacements', async () => {
      const clientId = 'client-id-1';
      const templateName = 'session-reminder';
      const replacements = {
        clientName: 'John Doe',
        sessionType: 'Speech Therapy',
        date: '2025-04-01',
      };

      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.communicationTemplate.findUnique.mockResolvedValue(mockTemplate);
      
      // Mock the create method which will be called internally
      service.create = jest.fn().mockResolvedValue(mockCommunication);

      const result = await service.sendTemplate(clientId, templateName, replacements);

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(mockPrismaService.communicationTemplate.findUnique).toHaveBeenCalledWith({
        where: { name: templateName },
      });
      
      // Verify the create method was called with the correct parameters
      expect(service.create).toHaveBeenCalledWith({
        clientId,
        type: mockTemplate.type,
        subject: expect.any(String),
        content: expect.any(String),
        status: CommunicationStatus.SENT,
      });
      
      expect(result).toEqual(mockCommunication);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.sendTemplate('non-existent-client', 'template', {})).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.communicationTemplate.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if template does not exist', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.communicationTemplate.findUnique.mockResolvedValue(null);

      await expect(service.sendTemplate('client-id-1', 'non-existent-template', {})).rejects.toThrow(NotFoundException);
    });
  });
});
