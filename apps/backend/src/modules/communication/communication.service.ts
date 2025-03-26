import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';

// Define Communication interface locally to match Prisma schema
export interface Communication {
  id: bigint;
  type: string;
  subject?: string;
  content: string;
  sentAt: Date;
  deliveryStatus?: string;
  notes?: string;
  recipientId: bigint;
  senderId: bigint;
  clientId?: bigint;
  learnerId?: bigint | null;
  appointmentId?: bigint | null;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: bigint;
  updatedBy?: bigint | null;
}

/**
 * Service handling communication-related business logic
 */
@Injectable()
export class CommunicationService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new communication
   * @param createCommunicationDto - Data for creating the communication
   * @param userId - ID of the user creating this communication
   * @returns The created communication
   */
  async create(createCommunicationDto: CreateCommunicationDto, userId: bigint): Promise<Communication> {
    // Verify client exists
    const client = await this.prismaService.client.findUnique({
      where: { id: BigInt(createCommunicationDto.clientId) },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createCommunicationDto.clientId} not found`);
    }

    // Prepare learner ID if provided
    let learnerId: bigint | null = null;
    if (createCommunicationDto.learnerId) {
      learnerId = BigInt(createCommunicationDto.learnerId);
      // Verify learner exists
      const learner = await this.prismaService.learner.findUnique({
        where: { id: learnerId },
      });

      if (!learner) {
        throw new NotFoundException(`Learner with ID ${createCommunicationDto.learnerId} not found`);
      }
    }

    // Prepare appointment ID if provided
    let appointmentId: bigint | null = null;
    if (createCommunicationDto.appointmentId) {
      appointmentId = BigInt(createCommunicationDto.appointmentId);
      // Verify appointment exists
      const appointment = await this.prismaService.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${createCommunicationDto.appointmentId} not found`);
      }
    }

    // Get sentAt date, default to current date if not provided
    const sentAt = createCommunicationDto.sentAt ? new Date(createCommunicationDto.sentAt) : new Date();

    // Create the communication
    const communication = await this.prismaService.communication.create({
      data: {
        type: createCommunicationDto.type,
        subject: createCommunicationDto.subject,
        content: createCommunicationDto.content,
        sentAt,
        notes: createCommunicationDto.notes,
        clientId: BigInt(createCommunicationDto.clientId),
        learnerId,
        appointmentId,
        createdBy: userId,
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
    }) as unknown as Communication;

    return communication;
  }

  /**
   * Find all communications with optional filters
   * @param clientId - Optional client ID to filter by
   * @param learnerId - Optional learner ID to filter by
   * @param type - Optional type to filter by
   * @returns Array of communications
   */
  async findAll(clientId?: string, learnerId?: string, type?: string): Promise<Communication[]> {
    const where: any = {};

    // Add filters if provided
    if (clientId) {
      where.clientId = BigInt(clientId);
    }

    if (learnerId) {
      where.learnerId = BigInt(learnerId);
    }

    if (type) {
      where.type = type;
    }

    const communications = await this.prismaService.communication.findMany({
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
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    }) as unknown as Communication[];

    return communications;
  }

  /**
   * Find a communication by ID
   * @param id - Communication ID
   * @returns The found communication
   */
  async findOne(id: bigint): Promise<Communication> {
    const communication = await this.prismaService.communication.findUnique({
      where: { id },
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
        appointment: true,
      },
    });

    if (!communication) {
      throw new NotFoundException(`Communication with ID ${id} not found`);
    }

    return communication as unknown as Communication;
  }

  /**
   * Update a communication
   * @param id - Communication ID
   * @param updateCommunicationDto - Data for updating the communication
   * @param userId - ID of the user updating this communication
   * @returns The updated communication
   */
  async update(
    id: bigint,
    updateCommunicationDto: UpdateCommunicationDto,
    userId: bigint
  ): Promise<Communication> {
    // Verify communication exists
    await this.findOne(id);

    // Prepare update data
    const updateData: any = { ...updateCommunicationDto };

    // Handle client ID conversion if provided
    if (updateCommunicationDto.clientId) {
      updateData.clientId = BigInt(updateCommunicationDto.clientId);
      
      // Verify client exists
      const client = await this.prismaService.client.findUnique({
        where: { id: updateData.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${updateCommunicationDto.clientId} not found`);
      }
    }

    // Handle learner ID conversion if provided
    if (updateCommunicationDto.learnerId !== undefined) {
      updateData.learnerId = updateCommunicationDto.learnerId 
        ? BigInt(updateCommunicationDto.learnerId) 
        : null;
      
      if (updateData.learnerId) {
        // Verify learner exists
        const learner = await this.prismaService.learner.findUnique({
          where: { id: updateData.learnerId },
        });

        if (!learner) {
          throw new NotFoundException(`Learner with ID ${updateCommunicationDto.learnerId} not found`);
        }
      }
    }

    // Handle appointment ID conversion if provided
    if (updateCommunicationDto.appointmentId !== undefined) {
      updateData.appointmentId = updateCommunicationDto.appointmentId 
        ? BigInt(updateCommunicationDto.appointmentId) 
        : null;
      
      if (updateData.appointmentId) {
        // Verify appointment exists
        const appointment = await this.prismaService.appointment.findUnique({
          where: { id: updateData.appointmentId },
        });

        if (!appointment) {
          throw new NotFoundException(`Appointment with ID ${updateCommunicationDto.appointmentId} not found`);
        }
      }
    }

    // Handle sentAt date conversion if provided
    if (updateCommunicationDto.sentAt) {
      updateData.sentAt = new Date(updateCommunicationDto.sentAt);
    }

    // Update the communication
    const updatedCommunication = await this.prismaService.communication.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: userId,
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
    }) as unknown as Communication;

    return updatedCommunication;
  }

  /**
   * Remove a communication
   * @param id - Communication ID
   * @returns The removed communication
   */
  async remove(id: bigint): Promise<Communication> {
    // Verify communication exists
    await this.findOne(id);

    // Delete the communication
    const deletedCommunication = await this.prismaService.communication.delete({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    }) as unknown as Communication;

    return deletedCommunication;
  }
}
