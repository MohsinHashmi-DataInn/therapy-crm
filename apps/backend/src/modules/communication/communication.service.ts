import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';

// Define Communication interface locally to match Prisma schema
export interface Communication {
  id: bigint;
  type: string;
  subject: string;
  content: string;
  sentAt: Date;
  notes?: string;
  clientId: bigint;
  learnerId?: bigint | null;
  appointmentId?: bigint | null;
  userId?: bigint | null;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: bigint | null;
  updatedBy?: bigint | null;
  client?: any;
  learner?: any;
  appointment?: any;
  user?: any;
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
    try {
      // Verify client exists
      const clientId = BigInt(createCommunicationDto.clientId);
      const client = await this.prismaService.client.findUnique({
        where: { id: clientId },
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
          clientId,
          learnerId,
          appointmentId,
          createdBy: userId,
          userId: userId // Set the user who created the communication
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

      return communication as unknown as Communication;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Handle BigInt conversion errors
      if (error instanceof Error && error.message.includes('BigInt')) {
        throw new Error(`Invalid ID format: ${error.message}`);
      }
      // Handle other errors
      throw new Error(`Failed to create communication: ${error instanceof Error ? error.message : String(error)}`);
    }
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
   * @param id Communication ID
   * @returns Communication record
   */
  async findOne(id: bigint): Promise<Communication> {
    try {
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
          appointment: true
        },
      });
      if (!communication) {
        throw new NotFoundException(`Communication with ID ${id} not found`);
      }
      return communication as unknown as Communication;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error) {
        throw new Error(`Failed to find communication: ${error.message}`);
      } else {
        throw new Error('Failed to find communication due to an unknown error');
      }
    }
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
    try {
      // Verify communication exists
      await this.findOne(id);

      // Prepare update data
      const updateData: Record<string, any> = {};

      // Only add fields that are present in the DTO to avoid undefined values
      if (updateCommunicationDto.type !== undefined) {
        updateData.type = updateCommunicationDto.type;
      }

      if (updateCommunicationDto.subject !== undefined) {
        updateData.subject = updateCommunicationDto.subject;
      }

      if (updateCommunicationDto.content !== undefined) {
        updateData.content = updateCommunicationDto.content;
      }

      if (updateCommunicationDto.notes !== undefined) {
        updateData.notes = updateCommunicationDto.notes;
      }

      // Handle client ID conversion if provided
      if (updateCommunicationDto.clientId) {
        const clientId = BigInt(updateCommunicationDto.clientId);
        
        // Verify client exists
        const client = await this.prismaService.client.findUnique({
          where: { id: clientId },
        });

        if (!client) {
          throw new NotFoundException(`Client with ID ${updateCommunicationDto.clientId} not found`);
        }
        
        updateData.clientId = clientId;
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

      // Always set the updatedBy field
      updateData.updatedBy = userId;

      // Update the communication
      const updatedCommunication = await this.prismaService.communication.update({
        where: { id },
        data: updateData,
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

      return updatedCommunication as unknown as Communication;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Handle BigInt conversion errors
      if (error instanceof Error && error.message.includes('BigInt')) {
        throw new Error(`Invalid ID format: ${error.message}`);
      }
      // Handle other errors
      throw new Error(`Failed to update communication: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a communication
   * @param id Communication ID
   */
  async remove(id: bigint): Promise<void> {
    try {
      // Check if the communication exists before trying to delete it
      const communication = await this.prismaService.communication.findUnique({
        where: { id },
      });

      if (!communication) {
        throw new NotFoundException(`Communication with ID ${id} not found`);
      }

      await this.prismaService.communication.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error) {
        throw new Error(`Failed to delete communication: ${error.message}`);
      } else {
        throw new Error('Failed to delete communication due to an unknown error');
      }
    }
  }
}
