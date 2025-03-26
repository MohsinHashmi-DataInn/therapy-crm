import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

// Define Client interface locally to match Prisma schema
export interface Client {
  id: bigint;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: string;
  priority?: string;
  therapistId?: bigint | null;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: bigint;
  updatedBy?: bigint;
}

/**
 * Service handling client-related business logic
 */
@Injectable()
export class ClientService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new client
   * @param createClientDto - Data for creating the client
   * @param userId - ID of the user creating this client
   * @returns The created client
   */
  async create(createClientDto: CreateClientDto, userId: bigint): Promise<Client> {
    // Check if client with this email already exists (if email provided)
    if (createClientDto.email) {
      const existingClient = await this.prismaService.client.findUnique({
        where: { email: createClientDto.email },
      });

      if (existingClient) {
        throw new ConflictException('Client with this email already exists');
      }
    }

    // Prepare therapist ID if provided
    let therapistId: bigint | null = null;
    if (createClientDto.therapistId) {
      therapistId = BigInt(createClientDto.therapistId);
    }

    // Create the client
    const client = await this.prismaService.client.create({
      data: {
        firstName: createClientDto.firstName,
        lastName: createClientDto.lastName,
        email: createClientDto.email,
        phone: createClientDto.phone,
        address: createClientDto.address,
        status: createClientDto.status,
        priority: createClientDto.priority,
        notes: createClientDto.notes,
        therapistId: therapistId,
        createdBy: userId,
      },
    }) as unknown as Client;

    return client;
  }

  /**
   * Find all clients with optional filtering
   * @param therapistId - Optional therapist ID to filter by
   * @param status - Optional status to filter by
   * @returns Array of clients
   */
  async findAll(therapistId?: string, status?: string): Promise<Client[]> {
    const where: any = {};

    // Add filters if provided
    if (therapistId) {
      where.therapistId = BigInt(therapistId);
    }

    if (status) {
      where.status = status;
    }

    const clients = await this.prismaService.client.findMany({
      where,
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as unknown as Client[];

    return clients;
  }

  /**
   * Find a client by ID
   * @param id - Client ID
   * @returns The found client
   */
  async findOne(id: bigint): Promise<Client> {
    const client = await this.prismaService.client.findUnique({
      where: { id },
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        learners: true,
        waitlist: true,
        appointments: {
          orderBy: {
            startTime: 'desc',
          },
          take: 5,
        },
        communications: {
          orderBy: {
            sentAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client as unknown as Client;
  }

  /**
   * Update a client
   * @param id - Client ID
   * @param updateClientDto - Data for updating the client
   * @param userId - ID of the user updating this client
   * @returns The updated client
   */
  async update(
    id: bigint, 
    updateClientDto: UpdateClientDto,
    userId: bigint
  ): Promise<Client> {
    // Check if client exists
    await this.findOne(id);

    // Check if updating email and if it already exists
    if (updateClientDto.email) {
      const existingClient = await this.prismaService.client.findUnique({
        where: { email: updateClientDto.email },
      }) as unknown as Client | null;

      if (existingClient && existingClient.id.toString() !== id.toString()) {
        throw new ConflictException('Email already in use by another client');
      }
    }

    // Prepare therapist ID if provided
    let therapistId: bigint | undefined;
    if (updateClientDto.therapistId) {
      therapistId = BigInt(updateClientDto.therapistId);
    }

    // Update the client
    const updatedClient = await this.prismaService.client.update({
      where: { id },
      data: {
        ...(updateClientDto as any), // Cast to any to avoid TypeScript errors with therapistId
        therapistId,
        updatedBy: userId,
      },
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as unknown as Client;

    return updatedClient;
  }

  /**
   * Remove a client
   * @param id - Client ID
   * @returns The removed client
   */
  async remove(id: bigint): Promise<Client> {
    // Check if client exists
    await this.findOne(id);

    // Delete the client
    const deletedClient = await this.prismaService.client.delete({
      where: { id },
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    }) as unknown as Client;

    return deletedClient;
  }
}
