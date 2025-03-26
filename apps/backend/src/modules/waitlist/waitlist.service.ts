import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';

/**
 * Enum for waitlist status values, must match Prisma schema definitions
 */
export enum WaitlistStatus {
  WAITING = 'WAITING',
  CONTACTED = 'CONTACTED',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED'
}

/**
 * Enum for service type values, must match Prisma schema definitions
 */
export enum ServiceType {
  SPEECH_THERAPY = 'SPEECH_THERAPY',
  OCCUPATIONAL_THERAPY = 'OCCUPATIONAL_THERAPY',
  PHYSICAL_THERAPY = 'PHYSICAL_THERAPY',
  BEHAVIORAL_THERAPY = 'BEHAVIORAL_THERAPY'
}

/**
 * Service handling waitlist business logic
 */
@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new waitlist entry
   * @param createWaitlistDto Data for creating waitlist entry
   * @param userId ID of user creating the entry
   * @returns Created waitlist entry
   */
  async create(createWaitlistDto: CreateWaitlistDto, userId: bigint) {
    const { clientId, serviceType, status } = createWaitlistDto;

    // Check if client exists using raw query
    const clientResult = await this.prisma.$queryRaw`
      SELECT id FROM "clients" WHERE id = ${BigInt(clientId)}
    `;

    const clientExists = Array.isArray(clientResult) && clientResult.length > 0;
    if (!clientExists) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // Create waitlist entry with default status if not provided
    const waitlistStatus = status || WaitlistStatus.WAITING;
    
    // Use raw SQL queries since we're having issues with Prisma client models
    const result = await this.prisma.$queryRaw`
      INSERT INTO "waitlist" (client_id, service_type, status, request_date, created_by)
      VALUES (${BigInt(clientId)}, ${serviceType}, ${waitlistStatus}, ${new Date()}, ${userId})
      RETURNING id, client_id, service_type, status, request_date, created_by
    `;

    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * Find all waitlist entries with optional filtering
   * @param serviceType Optional filter by service type
   * @param status Optional filter by waitlist status
   * @returns List of waitlist entries
   */
  async findAll(
    serviceType?: string,
    status?: string,
  ) {
    // Build the query with params to safely handle filtering
    let query = `
      SELECT w.*, 
        c.id as client_id, 
        c.first_name, 
        c.last_name, 
        c.email, 
        c.phone, 
        c.status as client_status, 
        c.priority
      FROM "waitlist" w
      JOIN "clients" c ON w.client_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (serviceType) {
      params.push(serviceType);
      query += ` AND w.service_type = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND w.status = $${params.length}`;
    }
    
    query += ` ORDER BY w.request_date ASC`;
    
    return await this.prisma.$queryRawUnsafe(query, ...params);
  }

  /**
   * Find waitlist entry by ID
   * @param id Waitlist entry ID
   * @returns Waitlist entry or null
   */
  async findOne(id: bigint) {
    const waitlistResult = await this.prisma.$queryRaw`
      SELECT w.*, 
        c.id as client_id, 
        c.first_name, 
        c.last_name, 
        c.email, 
        c.phone, 
        c.status as client_status, 
        c.priority
      FROM "waitlist" w
      JOIN "clients" c ON w.client_id = c.id
      WHERE w.id = ${id}
    `;

    const waitlistEntry = Array.isArray(waitlistResult) ? waitlistResult[0] : waitlistResult;
    
    if (!waitlistEntry) {
      throw new NotFoundException(`Waitlist entry with ID ${id} not found`);
    }

    return waitlistEntry;
  }

  /**
   * Update waitlist entry by ID
   * @param id Waitlist entry ID
   * @param updateWaitlistDto Data for updating waitlist entry
   * @param userId ID of user updating the entry
   * @returns Updated waitlist entry
   */
  async update(id: bigint, updateWaitlistDto: UpdateWaitlistDto, userId: bigint) {
    // Check if waitlist entry exists
    const existingResult = await this.prisma.$queryRaw`
      SELECT id FROM "waitlist" WHERE id = ${id}
    `;

    const entryExists = Array.isArray(existingResult) && existingResult.length > 0;
    if (!entryExists) {
      throw new NotFoundException(`Waitlist entry with ID ${id} not found`);
    }

    // Check if client exists if client ID is provided
    if (updateWaitlistDto.clientId) {
      const clientResult = await this.prisma.$queryRaw`
        SELECT id FROM "clients" WHERE id = ${BigInt(updateWaitlistDto.clientId)}
      `;

      const clientExists = Array.isArray(clientResult) && clientResult.length > 0;
      if (!clientExists) {
        throw new NotFoundException(`Client with ID ${updateWaitlistDto.clientId} not found`);
      }
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    updates.push(`updated_by = $${params.length + 1}`);
    params.push(userId);

    if (updateWaitlistDto.serviceType) {
      updates.push(`service_type = $${params.length + 1}`);
      params.push(updateWaitlistDto.serviceType);
    }

    if (updateWaitlistDto.status) {
      updates.push(`status = $${params.length + 1}`);
      params.push(updateWaitlistDto.status);
    }

    if (updateWaitlistDto.clientId) {
      updates.push(`client_id = $${params.length + 1}`);
      params.push(BigInt(updateWaitlistDto.clientId));
    }

    if (updateWaitlistDto.requestDate) {
      updates.push(`request_date = $${params.length + 1}`);
      params.push(new Date(updateWaitlistDto.requestDate));
    }

    // Add the ID as the last parameter
    params.push(id);
    
    const query = `
      UPDATE "waitlist"
      SET ${updates.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;
    
    await this.prisma.$queryRawUnsafe(query, ...params);
    
    // Return the updated record
    return this.findOne(id);
  }

  /**
   * Remove waitlist entry by ID
   * @param id Waitlist entry ID
   * @returns Removed waitlist entry
   */
  async remove(id: bigint) {
    // Check if waitlist entry exists
    const existingResult = await this.prisma.$queryRaw`
      SELECT id FROM "waitlist" WHERE id = ${id}
    `;

    const entryExists = Array.isArray(existingResult) && existingResult.length > 0;
    if (!entryExists) {
      throw new NotFoundException(`Waitlist entry with ID ${id} not found`);
    }

    // Delete the waitlist entry
    const result = await this.prisma.$queryRaw`
      DELETE FROM "waitlist"
      WHERE id = ${id}
      RETURNING *
    `;

    return Array.isArray(result) ? result[0] : result;
  }
}
