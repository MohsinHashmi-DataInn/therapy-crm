import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServiceCodeDto } from './dto/create-service-code.dto';
import { UpdateServiceCodeDto } from './dto/update-service-code.dto';

/**
 * Service for managing therapy service codes
 * Handles CRUD operations for billing codes (CPT or custom codes) used in invoicing
 */
@Injectable()
export class ServiceCodesService {
  private readonly logger = new Logger(ServiceCodesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new service code
   * @param createServiceCodeDto - Data for creating the service code
   * @param userId - ID of the user creating the service code
   * @returns The created service code
   * @throws ConflictException if a service code with the same code already exists
   */
  async create(createServiceCodeDto: CreateServiceCodeDto, userId: bigint) {
    try {
      // Check if service code with the same code already exists
      const existingCode = await this.prisma.service_codes.findUnique({
        where: { code: createServiceCodeDto.code },
      });

      if (existingCode) {
        throw new ConflictException(`Service code '${createServiceCodeDto.code}' already exists`);
      }

      // Create the new service code
      return this.prisma.service_codes.create({
        data: {
          code: createServiceCodeDto.code,
          description: createServiceCodeDto.description,
          rate: createServiceCodeDto.defaultRate,
          billable_unit: createServiceCodeDto.unit,
          is_active: createServiceCodeDto.isActive ?? true,
          notes: createServiceCodeDto.guidelines,
          tax_rate: 0,
          updated_at: new Date(),
          created_by: userId,
        },
      });
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create service code: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get all service codes with optional filtering by active status and category
   * @param activeOnly - If true, only return active service codes
   * @param category - Optional category to filter by
   * @returns List of service codes matching the criteria
   */
  async findAll(activeOnly = false, category?: string) {
    try {
      // Build where clause based on filters
      const where: any = {};
      
      if (activeOnly) {
        where.isActive = true;
      }
      
      if (category) {
        where.category = category;
      }
      
      return this.prisma.service_codes.findMany({
        where,
        orderBy: [
          { code: 'asc' },
        ],
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch service codes: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get a specific service code by ID
   * @param id - ID of the service code to find
   * @returns The service code if found
   * @throws NotFoundException if the service code doesn't exist
   */
  async findOne(id: bigint) {
    try {
      const serviceCode = await this.prisma.service_codes.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              invoice_line_items: true,
            },
          },
        },
      });

      if (!serviceCode) {
        throw new NotFoundException(`Service code with ID ${id} not found`);
      }

      return serviceCode;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch service code with ID ${id}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Find a service code by its code
   * @param code - Code of the service to find
   * @returns The service code if found
   * @throws NotFoundException if the service code doesn't exist
   */
  async findByCode(code: string) {
    try {
      const serviceCode = await this.prisma.service_codes.findUnique({
        where: { code },
        include: {
          _count: {
            select: {
              invoice_line_items: true,
            },
          },
        },
      });

      if (!serviceCode) {
        throw new NotFoundException(`Service code '${code}' not found`);
      }

      return serviceCode;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch service code '${code}': ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get list of all service code categories
   * @returns Array of unique categories used in service codes
   */
  async getCategories() {
    try {
      const result = await this.prisma.$queryRaw<{category: string}[]>`
        SELECT DISTINCT "category" 
        FROM "service_codes" 
        WHERE "category" IS NOT NULL 
        ORDER BY "category" ASC
      `;
      
      return result.map(item => item.category);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch service code categories: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Update a service code
   * @param id - ID of the service code to update
   * @param updateServiceCodeDto - Data for updating the service code
   * @returns The updated service code
   * @throws NotFoundException if the service code doesn't exist
   * @throws ConflictException if trying to change code to one that already exists
   */
  async update(id: bigint, updateServiceCodeDto: UpdateServiceCodeDto) {
    try {
      // Check if service code exists
      const serviceCode = await this.prisma.service_codes.findUnique({
        where: { id },
      });

      if (!serviceCode) {
        throw new NotFoundException(`Service code with ID ${id} not found`);
      }

      // If code is being updated, check for conflicts
      if (updateServiceCodeDto.code && updateServiceCodeDto.code !== serviceCode.code) {
        const existingCode = await this.prisma.service_codes.findUnique({
          where: { code: updateServiceCodeDto.code },
        });

        if (existingCode && existingCode.id !== id) {
          throw new ConflictException(`Service code '${updateServiceCodeDto.code}' already exists`);
        }
      }

      // Update the service code
      return this.prisma.service_codes.update({
        where: { id },
        data: {
          ...(updateServiceCodeDto.code && { code: updateServiceCodeDto.code }),
          ...(updateServiceCodeDto.description && { description: updateServiceCodeDto.description }),
          ...(updateServiceCodeDto.defaultRate !== undefined && { rate: updateServiceCodeDto.defaultRate }),
          ...(updateServiceCodeDto.unit && { billable_unit: updateServiceCodeDto.unit }),
          ...(updateServiceCodeDto.isActive !== undefined && { is_active: updateServiceCodeDto.isActive }),
          ...(updateServiceCodeDto.guidelines && { notes: updateServiceCodeDto.guidelines }),
          updated_at: new Date(),
        },
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update service code with ID ${id}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Delete a service code
   * @param id - ID of the service code to delete
   * @returns The deleted service code
   * @throws NotFoundException if the service code doesn't exist
   * @throws ConflictException if the service code is used in invoices or appointments
   */
  async remove(id: bigint) {
    try {
      // Check if service code exists and if it's being used
      const serviceCode = await this.prisma.service_codes.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              invoice_line_items: true,
            },
          },
        },
      });

      if (!serviceCode) {
        throw new NotFoundException(`Service code with ID ${id} not found`);
      }

      // Check if code is used in invoices or appointments
      const usageCount = serviceCode._count?.invoice_line_items || 0;
      if (usageCount > 0) {
        throw new ConflictException(
          `Cannot delete service code that is used in ${serviceCode._count?.invoice_line_items || 0} invoices`
        );
      }

      // Delete the service code
      return this.prisma.service_codes.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to delete service code with ID ${id}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
