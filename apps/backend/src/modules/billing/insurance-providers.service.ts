import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInsuranceProviderDto } from './dto/create-insurance-provider.dto';
import { UpdateInsuranceProviderDto } from './dto/update-insurance-provider.dto';

/**
 * Service for managing insurance providers
 * Handles CRUD operations for insurance providers and their relationships
 */
@Injectable()
export class InsuranceProvidersService {
  private readonly logger = new Logger(InsuranceProvidersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new insurance provider
   * @param createInsuranceProviderDto - Data for creating the insurance provider
   * @param userId - ID of the user creating the provider
   * @returns The created insurance provider
   * @throws ConflictException if an insurance provider with the same name already exists
   */
  async create(createInsuranceProviderDto: CreateInsuranceProviderDto, userId: bigint) {
    try {
      // Check if insurance provider with the same name already exists
      const existingProvider = await this.prisma.insuranceProvider.findUnique({
        where: { name: createInsuranceProviderDto.name },
      });

      if (existingProvider) {
        throw new ConflictException(`Insurance provider with name '${createInsuranceProviderDto.name}' already exists`);
      }

      // Create the new insurance provider
      return this.prisma.insuranceProvider.create({
        data: {
          ...createInsuranceProviderDto,
          createdById: userId,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create insurance provider: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all insurance providers
   * @returns List of all insurance providers
   */
  async findAll() {
    try {
      return this.prisma.insuranceProvider.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch insurance providers: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific insurance provider by ID
   * @param id - ID of the insurance provider to find
   * @returns The insurance provider if found
   * @throws NotFoundException if the insurance provider doesn't exist
   */
  async findOne(id: bigint) {
    try {
      const provider = await this.prisma.insuranceProvider.findUnique({
        where: { id },
      });

      if (!provider) {
        throw new NotFoundException(`Insurance provider with ID ${id} not found`);
      }

      return provider;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch insurance provider with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find an insurance provider by name
   * @param name - Name of the insurance provider to find
   * @returns The insurance provider if found
   * @throws NotFoundException if the insurance provider doesn't exist
   */
  async findByName(name: string) {
    try {
      const provider = await this.prisma.insuranceProvider.findUnique({
        where: { name },
      });

      if (!provider) {
        throw new NotFoundException(`Insurance provider with name '${name}' not found`);
      }

      return provider;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch insurance provider with name '${name}': ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an insurance provider
   * @param id - ID of the insurance provider to update
   * @param updateInsuranceProviderDto - Data for updating the insurance provider
   * @returns The updated insurance provider
   * @throws NotFoundException if the insurance provider doesn't exist
   * @throws ConflictException if trying to change name to one that already exists
   */
  async update(id: bigint, updateInsuranceProviderDto: UpdateInsuranceProviderDto) {
    try {
      // Check if insurance provider exists
      const provider = await this.prisma.insuranceProvider.findUnique({
        where: { id },
      });

      if (!provider) {
        throw new NotFoundException(`Insurance provider with ID ${id} not found`);
      }

      // If name is being updated, check for conflicts
      if (updateInsuranceProviderDto.name && updateInsuranceProviderDto.name !== provider.name) {
        const existingProvider = await this.prisma.insuranceProvider.findUnique({
          where: { name: updateInsuranceProviderDto.name },
        });

        if (existingProvider && existingProvider.id !== id) {
          throw new ConflictException(`Insurance provider with name '${updateInsuranceProviderDto.name}' already exists`);
        }
      }

      // Update the insurance provider
      return this.prisma.insuranceProvider.update({
        where: { id },
        data: updateInsuranceProviderDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to update insurance provider with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an insurance provider
   * @param id - ID of the insurance provider to delete
   * @returns The deleted insurance provider
   * @throws NotFoundException if the insurance provider doesn't exist
   * @throws ConflictException if the insurance provider is associated with clients or claims
   */
  async remove(id: bigint) {
    try {
      // Check if insurance provider exists
      const provider = await this.prisma.insuranceProvider.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              clients: true,
              insuranceClaims: true,
            },
          },
        },
      });

      if (!provider) {
        throw new NotFoundException(`Insurance provider with ID ${id} not found`);
      }

      // Check if provider is associated with clients or claims
      if (provider._count.clients > 0 || provider._count.insuranceClaims > 0) {
        throw new ConflictException(
          `Cannot delete insurance provider that is associated with ${provider._count.clients} clients and ${provider._count.insuranceClaims} claims`
        );
      }

      // Delete the insurance provider
      return this.prisma.insuranceProvider.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to delete insurance provider with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
