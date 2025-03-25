import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new client
   * @param createClientDto - Client data
   * @returns Newly created client
   */
  async create(createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  /**
   * Find all clients with optional filtering and sorting
   * @param options - Search and sort options
   * @returns List of clients
   */
  async findAll(options: { 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc';
  }) {
    const { search, sortBy = 'lastName', sortOrder = 'asc' } = options;
    
    let where: Prisma.ClientWhereInput = {};
    
    if (search) {
      where = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.client.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        learners: true,
        _count: {
          select: {
            appointments: true,
            communications: true,
          },
        },
      },
    });
  }

  /**
   * Find a client by ID
   * @param id - Client ID
   * @returns Client with related data
   * @throws NotFoundException if client not found
   */
  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        learners: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        communications: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
        waitlistEntries: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  /**
   * Update a client
   * @param id - Client ID
   * @param updateClientDto - Updated client data
   * @returns Updated client
   * @throws NotFoundException if client not found
   */
  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      return await this.prisma.client.update({
        where: { id },
        data: updateClientDto,
      });
    } catch (error) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
  }

  /**
   * Remove a client
   * @param id - Client ID
   * @returns Removed client
   * @throws NotFoundException if client not found
   */
  async remove(id: string) {
    try {
      return await this.prisma.client.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
  }
}
