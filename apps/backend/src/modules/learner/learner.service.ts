import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
import { LearnerStatus } from '../../types/prisma-models';

// Define local Learner interface to match the Prisma schema
export interface Learner {
  id: bigint;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  gender?: string;
  course?: string;
  schedule?: string;
  status?: LearnerStatus;
  notes?: string | null;
  clientId: bigint;
  instructorId?: bigint | null;
  createdBy?: bigint;
  updatedBy?: bigint | null;
}

/**
 * Service handling learner-related business logic
 */
@Injectable()
export class LearnerService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new learner
   * @param createLearnerDto - Data for creating the learner
   * @param userId - ID of the user creating this learner
   * @returns The created learner
   */
  async create(createLearnerDto: CreateLearnerDto, userId: bigint): Promise<Learner> {
    // Verify client exists
    const client = await this.prismaService.clients.findUnique({
      where: { id: BigInt(createLearnerDto.clientId) },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createLearnerDto.clientId} not found`);
    }

    // Prepare instructor ID if provided
    let instructorId: bigint | null = null;
    if (createLearnerDto.instructorId) {
      instructorId = BigInt(createLearnerDto.instructorId);
      // Verify instructor exists
      const instructor = await this.prismaService.users.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new NotFoundException(`Instructor with ID ${createLearnerDto.instructorId} not found`);
      }
    }

    // Handle date of birth conversion
    let dateOfBirth: Date | undefined;
    if (createLearnerDto.dateOfBirth) {
      dateOfBirth = new Date(createLearnerDto.dateOfBirth);
      if (isNaN(dateOfBirth.getTime())) {
        throw new BadRequestException('Invalid date of birth format');
      }
    }

    // Create learner
    const learner = await this.prismaService.learners.create({
      data: {
        first_name: createLearnerDto.firstName,
        last_name: createLearnerDto.lastName,
        dateOfBirth: dateOfBirth,
        gender: createLearnerDto.gender,
        course: createLearnerDto.course,
        schedule: createLearnerDto.schedule,
        status: createLearnerDto.status || 'ACTIVE',
        notes: createLearnerDto.notes,
        client: {
          connect: { id: BigInt(createLearnerDto.clientId) },
        },
        users_learners_instructor_idTousers: instructorId ? {
          connect: { id: instructorId },
        } : undefined,
        users_learners_created_byTousers: userId ? {
          connect: { id: userId },
        } : undefined,
      },
      include: {
        clients: true,
        users_learners_instructor_idTousers: true,
      },
    }) as unknown as Learner;

    return learner;
  }

  /**
   * Find all learners with optional filtering
   * @param clientId - Optional client ID to filter by
   * @param instructorId - Optional instructor ID to filter by
   * @param status - Optional status to filter by
   * @returns Array of learners
   */
  async findAll(clientId?: string, instructorId?: string, status?: string): Promise<Learner[]> {
    const where: any = {};

    // Add filters if provided
    if (clientId) {
      where.clientId = BigInt(clientId);
    }

    if (instructorId) {
      where.instructorId = BigInt(instructorId);
    }

    if (status) {
      where.status = status;
    }

    const learners = await this.prismaService.learner.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as unknown as Learner[];

    return learners;
  }

  /**
   * Find a learner by ID
   * @param id - Learner ID
   * @returns The found learner
   */
  async findOne(id: bigint): Promise<Learner> {
    const learner = await this.prismaService.learner.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointments: {
          orderBy: {
            startTime: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${id} not found`);
    }

    return learner as unknown as Learner;
  }

  /**
   * Update a learner
   * @param id - Learner ID
   * @param updateLearnerDto - Data for updating the learner
   * @param userId - ID of the user updating this learner
   * @returns The updated learner
   */
  async update(
    id: bigint,
    updateLearnerDto: UpdateLearnerDto,
    userId: bigint
  ): Promise<Learner> {
    // Check if learner exists
    await this.findOne(id);

    // Handle client ID if provided
    let clientId: bigint | undefined;
    if (updateLearnerDto.clientId) {
      const client = await this.prismaService.client.findUnique({
        where: { id: BigInt(updateLearnerDto.clientId) },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${updateLearnerDto.clientId} not found`);
      }

      clientId = BigInt(updateLearnerDto.clientId);
    }

    // Handle instructor ID if provided
    let instructorId: bigint | null | undefined;
    if (updateLearnerDto.instructorId !== undefined) {
      instructorId = updateLearnerDto.instructorId 
        ? BigInt(updateLearnerDto.instructorId) 
        : null;
      
      if (instructorId) {
        // Verify instructor exists
        const instructor = await this.prismaService.users.findUnique({
          where: { id: instructorId },
        });

        if (!instructor) {
          throw new NotFoundException(`Instructor with ID ${updateLearnerDto.instructorId} not found`);
        }
      }
    }

    // Handle date of birth conversion
    let dateOfBirth: Date | undefined;
    if (updateLearnerDto.dateOfBirth) {
      dateOfBirth = new Date(updateLearnerDto.dateOfBirth);
      if (isNaN(dateOfBirth.getTime())) {
        throw new BadRequestException('Invalid date of birth format');
      }
    }

    // Update the learner
    const updatedLearner = await this.prismaService.learner.update({
      where: { id },
      data: {
        firstName: updateLearnerDto.firstName,
        lastName: updateLearnerDto.lastName,
        dateOfBirth: dateOfBirth,
        gender: updateLearnerDto.gender,
        course: updateLearnerDto.course,
        schedule: updateLearnerDto.schedule,
        status: updateLearnerDto.status ? { set: updateLearnerDto.status } : undefined,
        notes: updateLearnerDto.notes,
        client: clientId ? {
          connect: { id: clientId },
        } : undefined,
        instructor: instructorId !== undefined ? (
          instructorId ? {
            connect: { id: instructorId },
          } : {
            disconnect: true,
          }
        ) : undefined,
        updatedByUser: userId ? {
          connect: { id: userId },
        } : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as unknown as Learner;

    return updatedLearner;
  }

  /**
   * Remove a learner
   * @param id - Learner ID
   * @returns The removed learner
   */
  async remove(id: bigint): Promise<Learner> {
    // Check if learner exists
    await this.findOne(id);

    // Delete the learner
    const deletedLearner = await this.prismaService.learner.delete({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as unknown as Learner;

    return deletedLearner;
  }
}
