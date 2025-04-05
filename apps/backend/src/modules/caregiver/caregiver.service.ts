import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { UpdateCaregiverDto } from './dto/update-caregiver.dto';

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
    const client = await this.prismaService.client.findUnique({
      where: { id: BigInt(createCaregiverDto.clientId) },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createCaregiverDto.clientId} not found`);
    }

    // If this is marked as primary, update any existing primary caregivers to not be primary
    if (createCaregiverDto.isPrimary) {
      await this.prismaService.caregiver.updateMany({
        where: { 
          clientId: BigInt(createCaregiverDto.clientId),
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    // Create the caregiver
    const caregiver = await this.prismaService.caregiver.create({
      data: {
        firstName: createCaregiverDto.firstName,
        lastName: createCaregiverDto.lastName,
        relationship: createCaregiverDto.relationship,
        isPrimary: createCaregiverDto.isPrimary,
        phone: createCaregiverDto.phone,
        email: createCaregiverDto.email,
        address: createCaregiverDto.address,
        city: createCaregiverDto.city,
        state: createCaregiverDto.state,
        zipCode: createCaregiverDto.zipCode,
        hasLegalCustody: createCaregiverDto.hasLegalCustody,
        isEmergencyContact: createCaregiverDto.isEmergencyContact,
        notes: createCaregiverDto.notes,
        clientId: BigInt(createCaregiverDto.clientId),
        createdBy: userId,
      },
    });

    return caregiver;
  }

  /**
   * Find all caregivers for a specific client
   * @param clientId - ID of the client
   * @returns Array of caregivers
   */
  async findAllByClient(clientId: bigint) {
    const caregivers = await this.prismaService.caregiver.findMany({
      where: { clientId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return caregivers;
  }

  /**
   * Find a caregiver by ID
   * @param id - Caregiver ID
   * @returns The found caregiver
   */
  async findOne(id: bigint) {
    const caregiver = await this.prismaService.caregiver.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!caregiver) {
      throw new NotFoundException(`Caregiver with ID ${id} not found`);
    }

    return caregiver;
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
    await this.findOne(id);

    // If this is being set as primary, update any existing primary caregivers
    if (updateCaregiverDto.isPrimary) {
      // Get the client ID for this caregiver
      const caregiver = await this.prismaService.caregiver.findUnique({
        where: { id },
        select: { clientId: true },
      });

      // Update other primary caregivers
      await this.prismaService.caregiver.updateMany({
        where: {
          clientId: caregiver.clientId,
          isPrimary: true,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    // Prepare client ID if provided
    let clientId: bigint | undefined;
    if (updateCaregiverDto.clientId) {
      clientId = BigInt(updateCaregiverDto.clientId);
    }

    // Update the caregiver
    const updatedCaregiver = await this.prismaService.caregiver.update({
      where: { id },
      data: {
        firstName: updateCaregiverDto.firstName,
        lastName: updateCaregiverDto.lastName,
        relationship: updateCaregiverDto.relationship,
        isPrimary: updateCaregiverDto.isPrimary,
        phone: updateCaregiverDto.phone,
        email: updateCaregiverDto.email,
        address: updateCaregiverDto.address,
        city: updateCaregiverDto.city,
        state: updateCaregiverDto.state,
        zipCode: updateCaregiverDto.zipCode,
        hasLegalCustody: updateCaregiverDto.hasLegalCustody,
        isEmergencyContact: updateCaregiverDto.isEmergencyContact,
        notes: updateCaregiverDto.notes,
        clientId,
        updatedBy: userId,
      },
    });

    return updatedCaregiver;
  }

  /**
   * Remove a caregiver
   * @param id - Caregiver ID
   * @returns The removed caregiver
   */
  async remove(id: bigint) {
    // Check if caregiver exists
    await this.findOne(id);

    // Remove the caregiver
    return this.prismaService.caregiver.delete({
      where: { id },
    });
  }
}
