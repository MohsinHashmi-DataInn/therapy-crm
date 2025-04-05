import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePracticeLocationDto } from './dto/create-practice-location.dto';
import { UpdatePracticeLocationDto } from './dto/update-practice-location.dto';

/**
 * Service for managing practice locations
 */
@Injectable()
export class PracticeLocationsService {
  private readonly logger = new Logger(PracticeLocationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new practice location
   * @param createPracticeLocationDto Location data to create
   * @param userId User ID of the creator
   * @returns Newly created practice location
   */
  async create(createPracticeLocationDto: CreatePracticeLocationDto, userId: BigInt) {
    try {
      // If this is set as primary, unset any existing primary locations
      if (createPracticeLocationDto.is_primary) {
        await this.prisma.practice_locations.updateMany({
          where: { is_primary: true },
          data: { is_primary: false },
        });
      }

      return await this.prisma.practice_locations.create({
        data: {
          ...createPracticeLocationDto,
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create practice location: ${error.message}`, error.stack);
      if (error.code === 'P2002') {
        throw new ConflictException('A practice location with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Find all practice locations with optional filtering
   * @param includeInactive Whether to include inactive locations
   * @returns List of practice locations
   */
  async findAll(includeInactive = false) {
    try {
      const whereClause = includeInactive ? {} : { is_active: true };
      
      return await this.prisma.practice_locations.findMany({
        where: whereClause,
        orderBy: [
          { is_primary: 'desc' },
          { name: 'asc' },
        ],
        include: {
          therapy_rooms: true,
          user_locations: {
            include: {
              users: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to find practice locations: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a single practice location by ID
   * @param id Location ID
   * @returns Practice location or throws exception if not found
   */
  async findOne(id: BigInt) {
    try {
      const location = await this.prisma.practice_locations.findUnique({
        where: { id },
        include: {
          therapy_rooms: true,
          user_locations: {
            include: {
              users: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!location) {
        throw new NotFoundException(`Practice location with ID ${id} not found`);
      }

      return location;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find practice location: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a practice location
   * @param id Location ID to update
   * @param updatePracticeLocationDto Updated location data
   * @param userId User ID making the update
   * @returns Updated practice location
   */
  async update(id: BigInt, updatePracticeLocationDto: UpdatePracticeLocationDto, userId: BigInt) {
    try {
      // Check if location exists
      await this.findOne(id);

      // If setting as primary, unset any existing primary locations
      if (updatePracticeLocationDto.is_primary) {
        await this.prisma.practice_locations.updateMany({
          where: { 
            id: { not: id },
            is_primary: true 
          },
          data: { is_primary: false },
        });
      }

      return await this.prisma.practice_locations.update({
        where: { id },
        data: {
          ...updatePracticeLocationDto,
          updated_by: userId,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update practice location: ${error.message}`, error.stack);
      if (error.code === 'P2002') {
        throw new ConflictException('A practice location with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Remove a practice location
   * @param id Location ID to remove
   * @returns Removed practice location
   */
  async remove(id: BigInt) {
    try {
      // Check if location exists
      await this.findOne(id);

      // Check if this is the primary location
      const location = await this.prisma.practice_locations.findUnique({
        where: { id },
        select: { is_primary: true },
      });

      if (location.is_primary) {
        throw new ConflictException('Cannot delete the primary practice location');
      }

      // Check if location has any active appointments
      const appointments = await this.prisma.appointments.findMany({
        where: { location_id: id },
        take: 1,
      });

      if (appointments.length > 0) {
        throw new ConflictException(
          'Cannot delete a location with associated appointments. Deactivate it instead.',
        );
      }

      return await this.prisma.practice_locations.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to remove practice location: ${error.message}`, error.stack);
      throw error;
    }
  }
}
