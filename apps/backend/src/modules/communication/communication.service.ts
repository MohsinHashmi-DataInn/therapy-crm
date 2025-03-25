import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { 
  CreateCommunicationDto, 
  UpdateCommunicationDto,
  CommunicationTemplateDto
} from './dto/communication.dto';
import { CommunicationType, CommunicationStatus } from '@prisma/client';

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new communication log entry
   * @param createCommunicationDto - Communication data
   * @returns Newly created communication
   */
  async create(createCommunicationDto: CreateCommunicationDto) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: createCommunicationDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createCommunicationDto.clientId} not found`);
    }

    return this.prisma.communication.create({
      data: {
        clientId: createCommunicationDto.clientId,
        type: createCommunicationDto.type,
        subject: createCommunicationDto.subject,
        content: createCommunicationDto.content,
        sentAt: createCommunicationDto.sentAt ? new Date(createCommunicationDto.sentAt) : new Date(),
        status: createCommunicationDto.status || CommunicationStatus.SENT,
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
      },
    });
  }

  /**
   * Find all communications with optional filtering
   * @param options - Filter options
   * @returns List of communications
   */
  async findAll(options: {
    type?: CommunicationType;
    status?: CommunicationStatus;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { 
      type, 
      status, 
      clientId, 
      startDate, 
      endDate, 
      sortBy = 'sentAt', 
      sortOrder = 'desc' 
    } = options;

    // Build where clause based on provided filters
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    // Handle date range
    if (startDate || endDate) {
      where.sentAt = {};
      
      if (startDate) {
        where.sentAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.sentAt.lte = new Date(endDate);
      }
    }

    return this.prisma.communication.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
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
   * Find a communication by ID
   * @param id - Communication ID
   * @returns Communication with related data
   * @throws NotFoundException if communication not found
   */
  async findOne(id: string) {
    const communication = await this.prisma.communication.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!communication) {
      throw new NotFoundException(`Communication with ID ${id} not found`);
    }

    return communication;
  }

  /**
   * Update a communication
   * @param id - Communication ID
   * @param updateCommunicationDto - Updated communication data
   * @returns Updated communication
   * @throws NotFoundException if communication not found
   */
  async update(id: string, updateCommunicationDto: UpdateCommunicationDto) {
    // If clientId is provided, verify client exists
    if (updateCommunicationDto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: updateCommunicationDto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${updateCommunicationDto.clientId} not found`);
      }
    }

    try {
      return await this.prisma.communication.update({
        where: { id },
        data: {
          type: updateCommunicationDto.type,
          subject: updateCommunicationDto.subject,
          content: updateCommunicationDto.content,
          sentAt: updateCommunicationDto.sentAt 
            ? new Date(updateCommunicationDto.sentAt) 
            : undefined,
          status: updateCommunicationDto.status,
          clientId: updateCommunicationDto.clientId,
        },
        include: {
          client: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Communication with ID ${id} not found`);
    }
  }

  /**
   * Remove a communication
   * @param id - Communication ID
   * @returns Removed communication
   * @throws NotFoundException if communication not found
   */
  async remove(id: string) {
    try {
      return await this.prisma.communication.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Communication with ID ${id} not found`);
    }
  }

  /**
   * Find all communications for a specific client
   * @param clientId - Client ID
   * @returns List of communications for the client
   */
  async findByClient(clientId: string) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return this.prisma.communication.findMany({
      where: { clientId },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Create a new communication template
   * @param templateDto - Template data
   * @returns Newly created template
   */
  async createTemplate(templateDto: CommunicationTemplateDto) {
    // Check if template with same name already exists
    const existingTemplate = await this.prisma.communicationTemplate.findUnique({
      where: { name: templateDto.name },
    });

    if (existingTemplate) {
      throw new BadRequestException(`Template with name ${templateDto.name} already exists`);
    }

    return this.prisma.communicationTemplate.create({
      data: {
        name: templateDto.name,
        subject: templateDto.subject,
        content: templateDto.content,
        type: templateDto.type,
      },
    });
  }

  /**
   * Get all communication templates
   * @returns List of communication templates
   */
  async getTemplates() {
    return this.prisma.communicationTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a communication template by name
   * @param name - Template name
   * @returns Communication template
   * @throws NotFoundException if template not found
   */
  async getTemplateByName(name: string) {
    const template = await this.prisma.communicationTemplate.findUnique({
      where: { name },
    });

    if (!template) {
      throw new NotFoundException(`Template with name ${name} not found`);
    }

    return template;
  }

  /**
   * Send a communication using a template
   * @param clientId - Client ID
   * @param templateName - Template name
   * @param replacements - Key-value pairs for template placeholders
   * @returns Newly created communication
   */
  async sendTemplate(
    clientId: string, 
    templateName: string, 
    replacements: Record<string, string>
  ) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // Get template
    const template = await this.getTemplateByName(templateName);

    // Replace placeholders in template content and subject
    let content = template.content;
    let subject = template.subject;

    // Process replacements
    for (const [key, value] of Object.entries(replacements)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
    }

    // Create communication
    return this.create({
      clientId,
      type: template.type,
      subject,
      content,
      status: CommunicationStatus.SENT,
    });
  }
}
