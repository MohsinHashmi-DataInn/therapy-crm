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
      const existingProvider = await this.prisma.insurance_providers.findFirst({
        where: { name: createInsuranceProviderDto.name },
      });

      if (existingProvider) {
        throw new ConflictException(`Insurance provider with name '${createInsuranceProviderDto.name}' already exists`);
      }

      // Create the new insurance provider
      return await this.prisma.insurance_providers.create({
        data: {
          name: createInsuranceProviderDto.name,
          phone: createInsuranceProviderDto.phone,
          email: createInsuranceProviderDto.email,
          website: createInsuranceProviderDto.website,
          address: createInsuranceProviderDto.address,
          notes: createInsuranceProviderDto.notes,
          submission_portal: createInsuranceProviderDto.claimSubmissionInstructions,
          submission_format: createInsuranceProviderDto.payerId,
          created_by: userId,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create insurance provider: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Get all insurance providers
   * @returns List of all insurance providers
   */
  async findAll() {
    try {
      return this.prisma.insurance_providers.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch insurance providers: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      const provider = await this.prisma.insurance_providers.findFirst({
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
      this.logger.error(`Failed to fetch insurance provider with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      const provider = await this.prisma.insurance_providers.findFirst({
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
      this.logger.error(`Failed to fetch insurance provider with name '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      const provider = await this.prisma.insurance_providers.findFirst({
        where: { id },
      });

      if (!provider) {
        throw new NotFoundException(`Insurance provider with ID ${id} not found`);
      }

      // If name is being updated, check for conflicts
      if (updateInsuranceProviderDto.name && updateInsuranceProviderDto.name !== provider.name) {
        const existingProvider = await this.prisma.insurance_providers.findFirst({
          where: { name: updateInsuranceProviderDto.name },
        });

        if (existingProvider && existingProvider.id !== id) {
          throw new ConflictException(`Insurance provider with name '${updateInsuranceProviderDto.name}' already exists`);
        }
      }

      // Update the insurance provider
      return this.prisma.insurance_providers.update({
        where: { id },
        data: {
          name: updateInsuranceProviderDto.name,
          phone: updateInsuranceProviderDto.phone,
          email: updateInsuranceProviderDto.email,
          website: updateInsuranceProviderDto.website,
          address: updateInsuranceProviderDto.address,
          notes: updateInsuranceProviderDto.notes,
          submission_portal: updateInsuranceProviderDto.claimSubmissionInstructions,
          submission_format: updateInsuranceProviderDto.payerId,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to update insurance provider with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      const provider = await this.prisma.insurance_providers.findFirst({
        where: { id },
        include: {
          client_insurance: true,
        },
      });

      if (!provider) {
        throw new NotFoundException(`Insurance provider with ID ${id} not found`);
      }

      // Check if provider is associated with clients
      if (provider.client_insurance.length > 0) {
        throw new ConflictException(
          `Cannot delete insurance provider that is associated with ${provider.client_insurance.length} clients`
        );
      }

      // Delete the insurance provider
      return this.prisma.insurance_providers.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to delete insurance provider with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
