import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTelehealthProviderDto } from './dto/create-telehealth-provider.dto';
import { UpdateTelehealthProviderDto } from './dto/update-telehealth-provider.dto';
import { createTypedPrismaClient } from '../../common/prisma/prisma.types';

/**
 * Service for managing telehealth providers
 */
@Injectable()
export class TelehealthProvidersService {
  private readonly logger = new Logger(TelehealthProvidersService.name);
  private readonly typedPrisma;

  constructor(private readonly prisma: PrismaService) {
    // Convert PrismaService to TypedPrismaClient to ensure type safety
    this.typedPrisma = createTypedPrismaClient(this.prisma);
  }

  /**
   * Create a new telehealth provider
   * @param createTelehealthProviderDto - Data for creating a telehealth provider
   * @returns The created telehealth provider
   */
  async create(createTelehealthProviderDto: CreateTelehealthProviderDto) {
    return this.typedPrisma.telehealth_providers.create({
      data: {
        name: createTelehealthProviderDto.name,
        api_key: createTelehealthProviderDto.api_key,
        api_secret: createTelehealthProviderDto.api_secret,
        base_url: createTelehealthProviderDto.base_url,
        logo_url: createTelehealthProviderDto.logo_url,
        provider_type: createTelehealthProviderDto.provider_type,
        is_active: createTelehealthProviderDto.is_active ?? true,
        configuration: createTelehealthProviderDto.configuration,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: createTelehealthProviderDto.created_by 
          ? BigInt(createTelehealthProviderDto.created_by) 
          : null,
        updated_by: createTelehealthProviderDto.updated_by 
          ? BigInt(createTelehealthProviderDto.updated_by) 
          : null,
      },
    });
  }

  /**
   * Find all telehealth providers
   * @param activeOnly - If true, only return active providers
   * @returns List of telehealth providers
   */
  async findAll(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    
    return this.typedPrisma.telehealth_providers.findMany({
      where,
      include: {
        users_telehealth_providers_created_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_telehealth_providers_updated_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }

  /**
   * Find one telehealth provider by ID
   * @param id - Telehealth provider ID
   * @returns The telehealth provider
   * @throws NotFoundException if provider not found
   */
  async findOne(id: bigint) {
    const provider = await this.typedPrisma.telehealth_providers.findUnique({
      where: { id },
      include: {
        users_telehealth_providers_created_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_telehealth_providers_updated_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException(`Telehealth provider with ID ${id} not found`);
    }

    return provider;
  }

  /**
   * Update a telehealth provider
   * @param id - Telehealth provider ID
   * @param updateTelehealthProviderDto - Updated data
   * @returns The updated telehealth provider
   * @throws NotFoundException if provider not found
   */
  async update(id: bigint, updateTelehealthProviderDto: UpdateTelehealthProviderDto) {
    try {
      return await this.typedPrisma.telehealth_providers.update({
        where: { id },
        data: {
          name: updateTelehealthProviderDto.name,
          api_key: updateTelehealthProviderDto.api_key,
          api_secret: updateTelehealthProviderDto.api_secret,
          base_url: updateTelehealthProviderDto.base_url,
          logo_url: updateTelehealthProviderDto.logo_url,
          provider_type: updateTelehealthProviderDto.provider_type,
          is_active: updateTelehealthProviderDto.is_active,
          configuration: updateTelehealthProviderDto.configuration,
          updated_at: new Date(),
          updated_by: updateTelehealthProviderDto.updated_by 
            ? BigInt(updateTelehealthProviderDto.updated_by) 
            : null,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Telehealth provider with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Remove a telehealth provider
   * @param id - Telehealth provider ID
   * @returns The deleted telehealth provider
   * @throws NotFoundException if provider not found
   */
  async remove(id: bigint) {
    try {
      return await this.typedPrisma.telehealth_providers.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Telehealth provider with ID ${id} not found`);
      }
      throw error;
    }
  }
}
