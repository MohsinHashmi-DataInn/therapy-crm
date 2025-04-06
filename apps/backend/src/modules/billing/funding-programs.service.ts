import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFundingProgramDto } from './dto/create-funding-program.dto';
import { UpdateFundingProgramDto } from './dto/update-funding-program.dto';

/**
 * Service for managing funding programs
 * Handles CRUD operations for government and private funding programs
 */
@Injectable()
export class FundingProgramsService {
  private readonly logger = new Logger(FundingProgramsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new funding program
   * @param createFundingProgramDto - Data for creating the funding program
   * @param userId - ID of the user creating the program
   * @returns The created funding program
   * @throws ConflictException if a funding program with the same name already exists
   */
  async create(createFundingProgramDto: CreateFundingProgramDto, userId: bigint) {
    try {
      // Check if funding program with the same name already exists
      const existingProgram = await this.prisma.funding_programs.findFirst({
        where: { name: createFundingProgramDto.name },
      });

      if (existingProgram) {
        throw new ConflictException(`Funding program with name '${createFundingProgramDto.name}' already exists`);
      }

      // Create the new funding program
      return this.prisma.funding_programs.create({
        data: {
          name: createFundingProgramDto.name,
          program_type: 'standard', // Default value since it's required by the schema
          description: createFundingProgramDto.description,
          max_amount: createFundingProgramDto.maxAnnualFunding ? createFundingProgramDto.maxAnnualFunding.toString() : null,
          is_active: createFundingProgramDto.isActive ?? true,
          contact_information: createFundingProgramDto.contactEmail || createFundingProgramDto.contactPhone ? 
            `Email: ${createFundingProgramDto.contactEmail || 'N/A'}, Phone: ${createFundingProgramDto.contactPhone || 'N/A'}` : null,
          website: createFundingProgramDto.website,
          application_process: createFundingProgramDto.applicationInstructions,
          renewal_process: createFundingProgramDto.renewalProcess,
          documentation_required: createFundingProgramDto.eligibilityRequirements,
          // Note: expirationDate is stored in description since there's no dedicated field
          created_by: userId,
          updated_at: new Date(),
        },
      });
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create funding program: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all funding programs with optional filtering by active status
   * @param activeOnly - If true, only return active programs
   * @returns List of funding programs matching the criteria
   */
  async findAll(activeOnly = false) {
    try {
      const where = activeOnly ? { is_active: true } : {};
      
      return this.prisma.funding_programs.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    } catch (error: any) {
      this.logger.error(`Failed to fetch funding programs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific funding program by ID
   * @param id - ID of the funding program to find
   * @returns The funding program if found
   * @throws NotFoundException if the funding program doesn't exist
   */
  async findOne(id: bigint) {
    try {
      const program = await this.prisma.funding_programs.findFirst({
        where: { id: id },
        include: {
          _count: {
            select: {
              client_funding: true,
            },
          },
        },
      });

      if (!program) {
        throw new NotFoundException(`Funding program with ID ${id} not found`);
      }

      return program;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch funding program with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a funding program by name
   * @param name - Name of the funding program to find
   * @returns The funding program if found
   * @throws NotFoundException if the funding program doesn't exist
   */
  async findByName(name: string) {
    try {
      // Since name is not a unique field in the schema, we need to use findFirst instead of findUnique
      const program = await this.prisma.funding_programs.findFirst({
        where: { name },
      });

      if (!program) {
        throw new NotFoundException(`Funding program with name '${name}' not found`);
      }

      return program;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch funding program with name '${name}': ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a funding program
   * @param id - ID of the funding program to update
   * @param updateFundingProgramDto - Data for updating the funding program
   * @returns The updated funding program
   * @throws NotFoundException if the funding program doesn't exist
   * @throws ConflictException if trying to change name to one that already exists
   */
  async update(id: bigint, updateFundingProgramDto: UpdateFundingProgramDto) {
    try {
      // Check if funding program exists
      const program = await this.prisma.funding_programs.findFirst({
        where: { id: id },
      });

      if (!program) {
        throw new NotFoundException(`Funding program with ID ${id} not found`);
      }

      // Check if any invoices use this funding program
      const relatedInvoices = await this.prisma.invoices.findMany({
        where: { 
          funding_id: id 
        },
      });

      if (relatedInvoices.length > 0) {
        throw new ConflictException(`Funding program with ID ${id} is associated with ${relatedInvoices.length} invoices`);
      }

      // If name is being updated, check for conflicts
      if (updateFundingProgramDto.name && updateFundingProgramDto.name !== program.name) {
        const existingProgram = await this.prisma.funding_programs.findFirst({
          where: { 
            AND: [
              { name: updateFundingProgramDto.name },
              { NOT: [{ id: id }] }
            ]
          },
        });

        if (existingProgram && existingProgram.id !== id) {
          throw new ConflictException(`Funding program with name '${updateFundingProgramDto.name}' already exists`);
        }
      }

      // Handle date conversion if needed
      const data = {
        name: updateFundingProgramDto.name || program.name,
        description: updateFundingProgramDto.description !== undefined ? updateFundingProgramDto.description : program.description,
        max_amount: updateFundingProgramDto.maxAnnualFunding !== undefined ? updateFundingProgramDto.maxAnnualFunding.toString() : program.max_amount,
        is_active: updateFundingProgramDto.isActive !== undefined ? updateFundingProgramDto.isActive : program.is_active,
        contact_information: updateFundingProgramDto.contactEmail || updateFundingProgramDto.contactPhone ? 
          `Email: ${updateFundingProgramDto.contactEmail || 'N/A'}, Phone: ${updateFundingProgramDto.contactPhone || 'N/A'}` : program.contact_information,
        website: updateFundingProgramDto.website !== undefined ? updateFundingProgramDto.website : program.website,
        documentation_required: updateFundingProgramDto.eligibilityRequirements !== undefined ? updateFundingProgramDto.eligibilityRequirements : program.documentation_required,
        application_process: updateFundingProgramDto.applicationInstructions !== undefined ? updateFundingProgramDto.applicationInstructions : program.application_process,
        renewal_process: updateFundingProgramDto.renewalProcess !== undefined ? updateFundingProgramDto.renewalProcess : program.renewal_process,
        // Note: expirationDate info will be stored in description if needed
        program_type: program.program_type, // Keep existing program_type
        updated_at: new Date(),
      };

      // Update the funding program
      return this.prisma.funding_programs.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to update funding program with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a funding program
   * @param id - ID of the funding program to delete
   * @returns The deleted funding program
   * @throws NotFoundException if the funding program doesn't exist
   * @throws ConflictException if the funding program is associated with clients
   */
  async remove(id: bigint) {
    try {
      // Check if funding program exists and if it has clients
      const program = await this.prisma.funding_programs.findFirst({
        where: { id: id },
        include: {
          _count: {
            select: {
              client_funding: true,
            },
          },
        },
      });

      if (!program) {
        throw new NotFoundException(`Funding program with ID ${id} not found`);
      }

      // Check if program is associated with clients
      if (program._count?.client_funding > 0) {
        throw new ConflictException(`Cannot delete funding program with ID ${id} because it has ${program._count?.client_funding} associated clients`);
      }

      // Delete the funding program
      return this.prisma.funding_programs.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to delete funding program with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
