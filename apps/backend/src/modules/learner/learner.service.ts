import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLearnerDto, UpdateLearnerDto } from './dto/learner.dto';
import { LearnerStatus } from '@prisma/client';

@Injectable()
export class LearnerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new learner
   * @param createLearnerDto - Learner data
   * @returns Newly created learner
   */
  async create(createLearnerDto: CreateLearnerDto) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: createLearnerDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createLearnerDto.clientId} not found`);
    }

    return this.prisma.learner.create({
      data: {
        firstName: createLearnerDto.firstName,
        lastName: createLearnerDto.lastName,
        dateOfBirth: createLearnerDto.dateOfBirth ? new Date(createLearnerDto.dateOfBirth) : null,
        course: createLearnerDto.course,
        schedule: createLearnerDto.schedule,
        status: createLearnerDto.status || LearnerStatus.ACTIVE,
        startDate: createLearnerDto.startDate ? new Date(createLearnerDto.startDate) : null,
        notes: createLearnerDto.notes,
        clientId: createLearnerDto.clientId,
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
      },
    });
  }

  /**
   * Find all learners with optional filtering and sorting
   * @param options - Search and filter options
   * @returns List of learners
   */
  async findAll(options: {
    search?: string;
    course?: string;
    status?: string;
    clientId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { 
      search, 
      course, 
      status, 
      clientId, 
      sortBy = 'lastName', 
      sortOrder = 'asc' 
    } = options;

    // Build where clause based on provided filters
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { course: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (course) {
      where.course = { contains: course, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    return this.prisma.learner.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
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
        _count: {
          select: {
            appointments: true,
            attendanceRecords: true,
          },
        },
      },
    });
  }

  /**
   * Find a learner by ID
   * @param id - Learner ID
   * @returns Learner with related data
   * @throws NotFoundException if learner not found
   */
  async findOne(id: string) {
    const learner = await this.prisma.learner.findUnique({
      where: { id },
      include: {
        client: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: {
            attendanceRecord: true,
          },
        },
      },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${id} not found`);
    }

    return learner;
  }

  /**
   * Update a learner
   * @param id - Learner ID
   * @param updateLearnerDto - Updated learner data
   * @returns Updated learner
   * @throws NotFoundException if learner not found
   */
  async update(id: string, updateLearnerDto: UpdateLearnerDto) {
    // If clientId is provided, verify client exists
    if (updateLearnerDto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: updateLearnerDto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${updateLearnerDto.clientId} not found`);
      }
    }

    try {
      return await this.prisma.learner.update({
        where: { id },
        data: {
          firstName: updateLearnerDto.firstName,
          lastName: updateLearnerDto.lastName,
          dateOfBirth: updateLearnerDto.dateOfBirth ? new Date(updateLearnerDto.dateOfBirth) : undefined,
          course: updateLearnerDto.course,
          schedule: updateLearnerDto.schedule,
          status: updateLearnerDto.status,
          startDate: updateLearnerDto.startDate ? new Date(updateLearnerDto.startDate) : undefined,
          notes: updateLearnerDto.notes,
          clientId: updateLearnerDto.clientId,
        },
        include: {
          client: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Learner with ID ${id} not found`);
    }
  }

  /**
   * Remove a learner
   * @param id - Learner ID
   * @returns Removed learner
   * @throws NotFoundException if learner not found
   */
  async remove(id: string) {
    try {
      return await this.prisma.learner.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Learner with ID ${id} not found`);
    }
  }

  /**
   * Find all learners for a specific client
   * @param clientId - Client ID
   * @returns List of learners for the client
   */
  async findByClient(clientId: string) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return this.prisma.learner.findMany({
      where: { clientId },
      include: {
        _count: {
          select: {
            appointments: true,
            attendanceRecords: true,
          },
        },
      },
    });
  }

  /**
   * Get attendance records for a learner
   * @param learnerId - Learner ID
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Attendance records for the learner
   */
  async getAttendanceRecords(learnerId: string, startDate?: string, endDate?: string) {
    // Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${learnerId} not found`);
    }

    // Build where clause based on provided date range
    const where: any = { learnerId };

    if (startDate || endDate) {
      where.appointment = {};
      
      if (startDate) {
        where.appointment.startTime = { gte: new Date(startDate) };
      }
      
      if (endDate) {
        where.appointment.startTime = { 
          ...(where.appointment.startTime || {}),
          lte: new Date(endDate)
        };
      }
    }

    return this.prisma.attendanceRecord.findMany({
      where,
      include: {
        appointment: true,
      },
      orderBy: {
        appointment: {
          startTime: 'desc',
        },
      },
    });
  }
}
