import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { UpdateCaregiverDto } from './dto/update-caregiver.dto';
import { Prisma } from '@prisma/client';

/**
 * Service handling caregiver-related business logic
 */
@Injectable()
export class CaregiverService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new caregiver
   * @param createCaregiverDto - Data for creating the caregiver
   * @param userId - ID of the user creating this caregiver
   * @returns The created caregiver
   */
  async create(createCaregiverDto: CreateCaregiverDto, userId: bigint) {
    // Check if client exists
    const client = await this.prismaService.clients.findUnique({
      where: { id: BigInt(createCaregiverDto.clientId) },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createCaregiverDto.clientId} not found`);
    }

    // Email is required for users
    if (!createCaregiverDto.email) {
      throw new BadRequestException('Email is required for caregivers');
    }

    // Create the caregiver as a user with CAREGIVER role
    const caregiver = await this.prismaService.users.create({
      data: {
        first_name: createCaregiverDto.firstName,
        last_name: createCaregiverDto.lastName,
        email: createCaregiverDto.email,
        phone: createCaregiverDto.phone,
        role: 'CAREGIVER',
        password: 'temporary_password', // This should be replaced with a secure password generation mechanism
        updated_at: new Date(),
        // Handle created_by as a relation field
        users_users_created_byTousers: userId ? {
          connect: { id: userId }
        } : undefined
      },
    });

    // Store the caregiver-client relationship in a separate data structure
    // Since user_clients doesn't exist, we'll need to implement an alternative approach
    // This could be done through a custom table or by extending the schema
    
    // For now, we'll return the caregiver data without the relationship details
    // A schema migration would be needed to properly implement caregiver-client relationships

    return {
      id: caregiver.id,
      firstName: caregiver.first_name,
      lastName: caregiver.last_name,
      email: caregiver.email,
      phone: caregiver.phone,
      clientId: BigInt(createCaregiverDto.clientId),
      relationship: createCaregiverDto.relationship,
      isPrimary: createCaregiverDto.isPrimary,
      hasLegalCustody: createCaregiverDto.hasLegalCustody,
      isEmergencyContact: createCaregiverDto.isEmergencyContact,
      createdBy: userId
    };
  }

  /**
   * Find all caregivers for a specific client
   * @param clientId - ID of the client
   * @returns Array of caregivers
   */
  async findAllByClient(clientId: bigint) {
    // Since we don't have user_clients table, we need to find caregivers differently
    // This is a placeholder implementation that returns users with CAREGIVER role
    // In a real implementation, we would need a proper relationship table
    
    const caregivers = await this.prismaService.users.findMany({
      where: {
        role: 'CAREGIVER',
        // We can't filter by client relationship without the proper table
      },
      orderBy: [
        { created_at: 'desc' },
      ],
    });

    // Transform the data to match the expected format
    // Note: Without user_clients table, we can't provide relationship details
    return caregivers.map(caregiver => ({
      id: caregiver.id,
      firstName: caregiver.first_name,
      lastName: caregiver.last_name,
      email: caregiver.email,
      phone: caregiver.phone,
      clientId: clientId, // This is just the requested clientId, not a real relationship
      createdAt: caregiver.created_at,
      createdBy: caregiver.created_by
      // Relationship details would be added here if we had the proper schema
    }));
  }

  /**
   * Find a caregiver by ID
   * @param id - Caregiver ID
   * @returns The found caregiver
   */
  async findOne(id: bigint) {
    const caregiver = await this.prismaService.users.findFirst({
      where: { 
        id,
        role: 'CAREGIVER'
      }
    });

    if (!caregiver) {
      throw new NotFoundException(`Caregiver with ID ${id} not found`);
    }

    // Transform the data to match the expected format
    return {
      id: caregiver.id,
      firstName: caregiver.first_name,
      lastName: caregiver.last_name,
      email: caregiver.email,
      phone: caregiver.phone,
      createdAt: caregiver.created_at,
      createdBy: caregiver.created_by
      // Client relationship details would be added here if we had the proper schema
    };
  }

  /**
   * Update a caregiver
   * @param id - Caregiver ID
   * @param updateCaregiverDto - Data for updating the caregiver
   * @param userId - ID of the user updating this caregiver
   * @returns The updated caregiver
   */
  async update(
    id: bigint,
    updateCaregiverDto: UpdateCaregiverDto,
    userId: bigint,
  ) {
    // Check if caregiver exists
    const existingCaregiver = await this.prismaService.users.findFirst({
      where: { 
        id,
        role: 'CAREGIVER'
      }
    });

    if (!existingCaregiver) {
      throw new NotFoundException(`Caregiver with ID ${id} not found`);
    }

    // Prepare the update data for the user
    // Define user data without explicit Prisma type annotation
    const userData = {
      first_name: updateCaregiverDto.firstName,
      last_name: updateCaregiverDto.lastName,
      email: updateCaregiverDto.email,
      phone: updateCaregiverDto.phone,
      updated_at: new Date()
    };
    
    // Handle updated_by separately since it's a relation field
    if (userId) {
      (userData as any).users_users_updated_byTousers = {
        connect: { id: userId }
      };
    }

    // Update the user
    const updatedUser = await this.prismaService.users.update({
      where: { id },
      data: userData,
    });

    // In a real implementation, we would update the caregiver-client relationship here
    // But without the proper schema, we can only update the user data

    // Get the updated caregiver
    return this.findOne(id);
  }

  /**
   * Remove a caregiver
   * @param id - Caregiver ID
   * @returns The removed caregiver
   */
  async remove(id: bigint) {
    // Check if caregiver exists
    const caregiver = await this.findOne(id);

    // In a real implementation, we would remove caregiver-client relationships here
    // But without the proper schema, we can only remove the user

    // Remove the caregiver user
    return this.prismaService.users.delete({
      where: { id },
    });
  }
}
