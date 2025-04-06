import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

// Define Client interface locally to match Prisma schema
export interface Client {
  id: bigint;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  address?: string;
  status: string;
  priority: string;
  notes?: string;
  therapist_id?: bigint | null;
  created_at: Date;
  updated_at: Date;
  created_by?: bigint | null;
  updated_by?: bigint | null;
  preferred_language?: string;
  requires_interpreter?: boolean;
  interpreter_notes?: string;
  insurancePolicyNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
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
      const existingClient = await this.prismaService.clients.findUnique({
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
    // Prepare client data for creation
    const clientData: any = {
      first_name: createClientDto.firstName,
      last_name: createClientDto.lastName,
      email: createClientDto.email,
      phone: createClientDto.phone,
      address: createClientDto.address,
      status: createClientDto.status,
      priority: createClientDto.priority,
      notes: createClientDto.notes,
      updated_at: new Date()
    };
    
    // Handle relations separately
    if (therapistId) {
      clientData.users_clients_therapist_idTousers = {
        connect: { id: therapistId }
      };
    }
    
    if (userId) {
      clientData.users_clients_created_byTousers = {
        connect: { id: userId }
      };
    }
    
    const client = await this.prismaService.clients.create({
      data: clientData,
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
      where.therapist_id = BigInt(therapistId);
    }

    if (status) {
      where.status = status;
    }

    const clients = await this.prismaService.clients.findMany({
      where,
      include: {
        users_clients_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
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
    const client = await this.prismaService.clients.findUnique({
      where: { id },
      include: {
        users_clients_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        learners: true,
        waitlist: true,
        appointments: {
          orderBy: {
            start_time: 'desc',
          },
          take: 5,
        },
        communications: {
          orderBy: {
            sent_at: 'desc',
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
      const existingClient = await this.prismaService.clients.findUnique({
        where: { email: updateClientDto.email },
      }) as unknown as Client | null;

      if (existingClient && existingClient.id.toString() !== id.toString()) {
        throw new ConflictException('Email already in use by another client');
      }
    }

    // Prepare therapist ID if provided
    let therapist_id: bigint | undefined;
    if (updateClientDto.therapistId) {
      therapist_id = BigInt(updateClientDto.therapistId);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };
    
    // Add fields only if they are defined in the DTO
    if (updateClientDto.firstName !== undefined) {
      updateData.first_name = updateClientDto.firstName;
    }
    
    if (updateClientDto.lastName !== undefined) {
      updateData.last_name = updateClientDto.lastName;
    }
    
    if (updateClientDto.email !== undefined) {
      updateData.email = updateClientDto.email;
    }
    
    if (updateClientDto.phone !== undefined) {
      updateData.phone = updateClientDto.phone;
    }
    
    if (updateClientDto.address !== undefined) {
      updateData.address = updateClientDto.address;
    }
    
    if (updateClientDto.status !== undefined) {
      updateData.status = updateClientDto.status;
    }
    
    if (updateClientDto.priority !== undefined) {
      updateData.priority = updateClientDto.priority;
    }
    
    if (updateClientDto.notes !== undefined) {
      updateData.notes = updateClientDto.notes;
    }
    
    // Handle relations separately
    if (therapist_id) {
      updateData.users_clients_therapist_idTousers = {
        connect: { id: therapist_id }
      };
    }
    
    if (userId) {
      updateData.users_clients_updated_byTousers = {
        connect: { id: userId }
      };
    }
    
    // Update the client
    const updatedClient = await this.prismaService.clients.update({
      where: { id },
      data: updateData,
      include: {
        users_clients_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
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
    const deletedClient = await this.prismaService.clients.delete({
      where: { id },
      include: {
        users_clients_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          }
        }
      }
    }) as unknown as Client;

    return deletedClient;
  }
}
