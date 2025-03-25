import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWaitlistEntryDto, UpdateWaitlistEntryDto } from './dto/waitlist.dto';
import { WaitlistPriority, WaitlistStatus } from '@prisma/client';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new waitlist entry
   * @param createWaitlistEntryDto - Waitlist entry data
   * @returns Newly created waitlist entry
   */
  async create(createWaitlistEntryDto: CreateWaitlistEntryDto) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: createWaitlistEntryDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createWaitlistEntryDto.clientId} not found`);
    }

    return this.prisma.waitlistEntry.create({
      data: {
        clientId: createWaitlistEntryDto.clientId,
        priority: createWaitlistEntryDto.priority || WaitlistPriority.MEDIUM,
        requestedService: createWaitlistEntryDto.requestedService,
        notes: createWaitlistEntryDto.notes,
        status: createWaitlistEntryDto.status || WaitlistStatus.WAITING,
        followUpDate: createWaitlistEntryDto.followUpDate ? new Date(createWaitlistEntryDto.followUpDate) : null,
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
   * Find all waitlist entries with optional filtering
   * @param options - Filter options
   * @returns List of waitlist entries
   */
  async findAll(options: {
    priority?: WaitlistPriority;
    status?: WaitlistStatus;
    clientId?: string;
    followUpFrom?: string;
    followUpTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { 
      priority, 
      status, 
      clientId, 
      followUpFrom, 
      followUpTo, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = options;

    // Build where clause based on provided filters
    const where: any = {};

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    // Handle follow-up date range
    if (followUpFrom || followUpTo) {
      where.followUpDate = {};
      
      if (followUpFrom) {
        where.followUpDate.gte = new Date(followUpFrom);
      }
      
      if (followUpTo) {
        where.followUpDate.lte = new Date(followUpTo);
      }
    }

    return this.prisma.waitlistEntry.findMany({
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
   * Find a waitlist entry by ID
   * @param id - Waitlist entry ID
   * @returns Waitlist entry with related data
   * @throws NotFoundException if waitlist entry not found
   */
  async findOne(id: string) {
    const waitlistEntry = await this.prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!waitlistEntry) {
      throw new NotFoundException(`Waitlist entry with ID ${id} not found`);
    }

    return waitlistEntry;
  }

  /**
   * Update a waitlist entry
   * @param id - Waitlist entry ID
   * @param updateWaitlistEntryDto - Updated waitlist entry data
   * @returns Updated waitlist entry
   * @throws NotFoundException if waitlist entry not found
   */
  async update(id: string, updateWaitlistEntryDto: UpdateWaitlistEntryDto) {
    // If clientId is provided, verify client exists
    if (updateWaitlistEntryDto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: updateWaitlistEntryDto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${updateWaitlistEntryDto.clientId} not found`);
      }
    }

    try {
      return await this.prisma.waitlistEntry.update({
        where: { id },
        data: {
          priority: updateWaitlistEntryDto.priority,
          requestedService: updateWaitlistEntryDto.requestedService,
          notes: updateWaitlistEntryDto.notes,
          status: updateWaitlistEntryDto.status,
          followUpDate: updateWaitlistEntryDto.followUpDate 
            ? new Date(updateWaitlistEntryDto.followUpDate) 
            : undefined,
          clientId: updateWaitlistEntryDto.clientId,
        },
        include: {
          client: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Waitlist entry with ID ${id} not found`);
    }
  }

  /**
   * Remove a waitlist entry
   * @param id - Waitlist entry ID
   * @returns Removed waitlist entry
   * @throws NotFoundException if waitlist entry not found
   */
  async remove(id: string) {
    try {
      return await this.prisma.waitlistEntry.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Waitlist entry with ID ${id} not found`);
    }
  }

  /**
   * Get waitlist entries with follow-ups due today or overdue
   * @returns List of waitlist entries with due follow-ups
   */
  async getDueFollowUps() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.waitlistEntry.findMany({
      where: {
        followUpDate: {
          lte: today,
        },
        status: {
          not: WaitlistStatus.REMOVED,
        },
      },
      orderBy: [
        { priority: 'asc' }, // HIGH first
        { followUpDate: 'asc' }, // Oldest follow-up date first
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
  }

  /**
   * Find all waitlist entries for a specific client
   * @param clientId - Client ID
   * @returns List of waitlist entries for the client
   */
  async findByClient(clientId: string) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return this.prisma.waitlistEntry.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
