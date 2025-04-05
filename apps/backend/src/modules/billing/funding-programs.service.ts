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
      const existingProgram = await this.prisma.fundingProgram.findUnique({
        where: { name: createFundingProgramDto.name },
      });

      if (existingProgram) {
        throw new ConflictException(`Funding program with name '${createFundingProgramDto.name}' already exists`);
      }

      // Create the new funding program
      return this.prisma.fundingProgram.create({
        data: {
          ...createFundingProgramDto,
          expirationDate: createFundingProgramDto.expirationDate 
            ? new Date(createFundingProgramDto.expirationDate) 
            : null,
          createdById: userId,
        },
      });
    } catch (error) {
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
      const where = activeOnly ? { isActive: true } : {};
      
      return this.prisma.fundingProgram.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    } catch (error) {
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
      const program = await this.prisma.fundingProgram.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              clients: true,
            },
          },
        },
      });

      if (!program) {
        throw new NotFoundException(`Funding program with ID ${id} not found`);
      }

      return program;
    } catch (error) {
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
      const program = await this.prisma.fundingProgram.findUnique({
        where: { name },
        include: {
          _count: {
            select: {
              clients: true,
            },
          },
        },
      });

      if (!program) {
        throw new NotFoundException(`Funding program with name '${name}' not found`);
      }

      return program;
    } catch (error) {
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
      const program = await this.prisma.fundingProgram.findUnique({
        where: { id },
      });

      if (!program) {
        throw new NotFoundException(`Funding program with ID ${id} not found`);
      }

      // If name is being updated, check for conflicts
      if (updateFundingProgramDto.name && updateFundingProgramDto.name !== program.name) {
        const existingProgram = await this.prisma.fundingProgram.findUnique({
          where: { name: updateFundingProgramDto.name },
        });

        if (existingProgram && existingProgram.id !== id) {
          throw new ConflictException(`Funding program with name '${updateFundingProgramDto.name}' already exists`);
        }
      }

      // Handle date conversion if needed
      const data = { 
        ...updateFundingProgramDto,
        expirationDate: updateFundingProgramDto.expirationDate 
          ? new Date(updateFundingProgramDto.expirationDate) 
          : program.expirationDate,
      };

      // Update the funding program
      return this.prisma.fundingProgram.update({
        where: { id },
        data,
      });
    } catch (error) {
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
      const program = await this.prisma.fundingProgram.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              clients: true,
            },
          },
        },
      });

      if (!program) {
        throw new NotFoundException(`Funding program with ID ${id} not found`);
      }

      // Check if program is associated with clients
      if (program._count.clients > 0) {
        throw new ConflictException(
          `Cannot delete funding program that is associated with ${program._count.clients} clients`
        );
      }

      // Delete the funding program
      return this.prisma.fundingProgram.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to delete funding program with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
