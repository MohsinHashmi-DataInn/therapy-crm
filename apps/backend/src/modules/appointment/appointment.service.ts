import { Injectable, NotFoundException, BadRequestException, ConflictException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAppointmentDto, AppointmentType, AppointmentStaffDto, AppointmentEquipmentDto, GroupParticipantDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '@prisma/client';
import { TherapyResourceService } from './services/therapy-resource.service';
import { RecurrencePatternService } from './services/recurrence-pattern.service';

export interface Appointment {
  id: bigint;
  startTime: Date;
  endTime: Date;
  type: string;
  status: string;
  title?: string;
  notes?: string;
  location?: string;
  clientId?: bigint | null;
  learnerId?: bigint | null;
  therapistId: bigint;
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy?: bigint | null;
  updatedBy?: bigint | null;
  // Include relations for TypeScript purposes
  client?: any;
  learner?: any;
  therapist?: any;
}

/**
 * Service handling appointment-related business logic
 */
@Injectable()
export class AppointmentService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new appointment
   * @param createAppointmentDto - Data for creating the appointment
   * @param userId - ID of the user creating this appointment
   * @returns The created appointment
   */
  async create(createAppointmentDto: CreateAppointmentDto, userId: bigint): Promise<Appointment> {
    // Convert start and end times to Date objects
    const startTime = new Date(createAppointmentDto.startTime);
    const endTime = new Date(createAppointmentDto.endTime);

    // Validate start and end times
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Ensure appointments aren't in the past
    const now = new Date();
    if (startTime < now) {
      throw new BadRequestException('Appointments cannot be scheduled in the past');
    }

    // Convert IDs to BigInt
    const therapistId = BigInt(createAppointmentDto.therapistId);
    let clientId: bigint;
    let learnerId: bigint | null = null;

    // Client ID is required in the Prisma schema
    if (!createAppointmentDto.clientId) {
      throw new BadRequestException('Client ID is required');
    }
    clientId = BigInt(createAppointmentDto.clientId);
      
    // Verify client exists
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createAppointmentDto.clientId} not found`);
    }

    if (createAppointmentDto.learnerId) {
      learnerId = BigInt(createAppointmentDto.learnerId);
      
      // Verify learner exists
      const learner = await this.prismaService.learner.findUnique({
        where: { id: learnerId },
      }) as unknown as { id: bigint; clientId: bigint };

      if (!learner) {
        throw new NotFoundException(`Learner with ID ${createAppointmentDto.learnerId} not found`);
      }

      // If client ID not provided, get it from learner
      if (!clientId) {
        clientId = learner.clientId;
      }
    }

    // Verify therapist exists
    const therapist = await this.prismaService.user.findUnique({
      where: { id: therapistId },
    });

    if (!therapist) {
      throw new NotFoundException(`Therapist with ID ${createAppointmentDto.therapistId} not found`);
    }

    // Check for therapist appointment conflicts
    await this.checkForAppointmentConflicts(
      therapistId,
      null,
      startTime,
      endTime
    );

    // Create the appointment
    return this.prismaService.appointment.create({
      data: {
        startTime,
        endTime,
        // Remove type field as it's not in the Prisma schema
        status: createAppointmentDto.status || AppointmentStatus.SCHEDULED,
        title: createAppointmentDto.title,
        notes: createAppointmentDto.notes,
        location: createAppointmentDto.location,
        client: {
          connect: { id: clientId }
        },
        learner: learnerId ? {
          connect: { id: learnerId }
        } : undefined,
        therapist: {
          connect: { id: therapistId }
        },
        createdByUser: userId ? {
          connect: { id: userId }
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
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as unknown as Appointment;
  }

  /**
   * Find all appointments with optional filtering
   * @param startDate - Optional start date to filter by
   * @param endDate - Optional end date to filter by
   * @param therapistId - Optional therapist ID to filter by
   * @param clientId - Optional client ID to filter by
   * @param learnerId - Optional learner ID to filter by
   * @param status - Optional status to filter by
   * @returns Array of appointments
   */
  async findAll(
    startDate?: string,
    endDate?: string,
    therapistId?: string,
    clientId?: string,
    learnerId?: string,
    status?: string,
  ): Promise<Appointment[]> {
    const where: any = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      where.startTime = {};
      
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    // Add other filters if provided
    if (therapistId) {
      where.therapistId = BigInt(therapistId);
    }

    if (clientId) {
      where.clientId = BigInt(clientId);
    }

    if (learnerId) {
      where.learnerId = BigInt(learnerId);
    }

    if (status) {
      where.status = status;
    }

    return this.prismaService.appointment.findMany({
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
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    }) as unknown as Appointment[];
  }

  /**
   * Find an appointment by ID
   * @param id - Appointment ID
   * @returns The found appointment
   */
  async findOne(id: bigint): Promise<Appointment> {
    const appointment = await this.prismaService.appointment.findUnique({
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
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as unknown as Appointment | null;

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  /**
   * Update an appointment
   * @param id - Appointment ID
   * @param updateAppointmentDto - Data for updating the appointment
   * @param userId - ID of the user updating this appointment
   * @returns The updated appointment
   */
  async update(
    id: bigint,
    updateAppointmentDto: UpdateAppointmentDto,
    userId: bigint
  ): Promise<Appointment> {
    // Check if appointment exists
    const existingAppointment = await this.findOne(id);

    // Prepare update data
    const updateData: any = {
      updatedBy: userId,
    };

    // Handle start and end time updates
    let startTime = existingAppointment.startTime;
    let endTime = existingAppointment.endTime;

    if (updateAppointmentDto.startTime) {
      startTime = new Date(updateAppointmentDto.startTime);
      updateData.startTime = startTime;
    }

    if (updateAppointmentDto.endTime) {
      endTime = new Date(updateAppointmentDto.endTime);
      updateData.endTime = endTime;
    }

    // Validate times if either start or end time is updated
    if (updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
      this.validateAppointmentTimes(startTime, endTime);
    }

    // Handle ID updates and validate entities exist
    let therapistId = existingAppointment.therapistId;
    if (updateAppointmentDto.therapistId) {
      therapistId = BigInt(updateAppointmentDto.therapistId);
      
      // Verify therapist exists
      const therapist = await this.prismaService.user.findUnique({
        where: { id: therapistId },
      });

      if (!therapist) {
        throw new NotFoundException(`Therapist with ID ${updateAppointmentDto.therapistId} not found`);
      }

      updateData.therapistId = therapistId;
    }

    let clientId = existingAppointment.clientId;
    if (updateAppointmentDto.clientId !== undefined) {
      if (updateAppointmentDto.clientId) {
        clientId = BigInt(updateAppointmentDto.clientId);
        
        // Verify client exists
        const client = await this.prismaService.client.findUnique({
          where: { id: clientId },
        });

        if (!client) {
          throw new NotFoundException(`Client with ID ${updateAppointmentDto.clientId} not found`);
        }
      } else {
        clientId = null;
      }

      updateData.clientId = clientId;
    }

    let learnerId = existingAppointment.learnerId;
    if (updateAppointmentDto.learnerId !== undefined) {
      if (updateAppointmentDto.learnerId) {
        learnerId = BigInt(updateAppointmentDto.learnerId);
        
        // Verify learner exists
        const learner = await this.prismaService.learner.findUnique({
          where: { id: learnerId },
        }) as unknown as { id: bigint; clientId: bigint };

        if (!learner) {
          throw new NotFoundException(`Learner with ID ${updateAppointmentDto.learnerId} not found`);
        }

        // If client ID not provided, get it from learner
        if (clientId === null && !updateAppointmentDto.clientId) {
          const learner = await this.prismaService.learner.findUnique({
            where: { id: learnerId },
          }) as unknown as { id: bigint; clientId: bigint };
          
          clientId = learner.clientId;
          updateData.clientId = clientId;
        }
      } else {
        learnerId = null;
      }

      updateData.learnerId = learnerId;
    }

    // Add other fields to update data
    if (updateAppointmentDto.type !== undefined) {
      updateData.type = updateAppointmentDto.type;
    }

    if (updateAppointmentDto.status !== undefined) {
      updateData.status = updateAppointmentDto.status;
    }

    if (updateAppointmentDto.title !== undefined) {
      updateData.title = updateAppointmentDto.title;
    }

    if (updateAppointmentDto.notes !== undefined) {
      updateData.notes = updateAppointmentDto.notes;
    }

    if (updateAppointmentDto.location !== undefined) {
      updateData.location = updateAppointmentDto.location;
    }

    // Check for appointment conflicts if times or therapist changed
    if (
      updateAppointmentDto.startTime ||
      updateAppointmentDto.endTime ||
      updateAppointmentDto.therapistId
    ) {
      await this.checkForAppointmentConflicts(
        therapistId,
        id,
        startTime,
        endTime
      );
    }

    // Update the appointment
    return this.prismaService.appointment.update({
      where: { id },
      data: updateData,
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
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as unknown as Appointment;
  }

  /**
   * Remove an appointment
   * @param id - Appointment ID
   * @returns The removed appointment
   */
  async remove(id: bigint): Promise<Appointment> {
    // Check if appointment exists
    await this.findOne(id);

    // Delete the appointment
    return this.prismaService.appointment.delete({
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
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as unknown as Appointment;
  }

  /**
   * Validate appointment start and end times
   * @param startTime - Appointment start time
   * @param endTime - Appointment end time
   */
  private validateAppointmentTimes(startTime: Date, endTime: Date): void {
    // Check if start time is in the past
    if (startTime < new Date()) {
      throw new BadRequestException('Start time cannot be in the past');
    }

    // Check if end time is before start time
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Check if appointment is too short (e.g., less than 15 minutes)
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (durationMinutes < 15) {
      throw new BadRequestException('Appointment duration must be at least 15 minutes');
    }

    // Check if appointment is too long (e.g., more than 4 hours)
    if (durationMinutes > 240) {
      throw new BadRequestException('Appointment duration cannot exceed 4 hours');
    }
  }

  /**
   * Check for appointment conflicts
   * @param therapistId - Therapist ID
   * @param excludeAppointmentId - Optional appointment ID to exclude from conflict check
   * @param startTime - Appointment start time
   * @param endTime - Appointment end time
   */
  private async checkForAppointmentConflicts(
    therapistId: bigint,
    excludeAppointmentId: bigint | null,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    // Create base query to find conflicting appointments
    const whereCondition: any = {
      therapistId,
      status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED] },
      OR: [
        {
          // Case 1: New appointment starts during an existing appointment
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        {
          // Case 2: New appointment contains an existing appointment
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    };

    // Exclude the current appointment if updating
    if (excludeAppointmentId) {
      whereCondition.id = { not: excludeAppointmentId };
    }

    // Find conflicting appointments
    const conflictingAppointments = await this.prismaService.appointment.findMany({
      where: whereCondition,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        title: true,
        therapist: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Throw error if conflicts found
    if (conflictingAppointments.length > 0) {
      const conflict = conflictingAppointments[0] as unknown as {
        id: bigint;
        startTime: Date;
        endTime: Date;
        title: string;
        therapist: {
          firstName: string;
          lastName: string;
        };
      };
      
      const conflictStart = conflict.startTime.toLocaleTimeString();
      const conflictEnd = conflict.endTime.toLocaleTimeString();
      const therapistName = `${conflict.therapist.firstName} ${conflict.therapist.lastName}`;
      
      throw new ConflictException(
        `Appointment conflicts with existing appointment for ${therapistName} from ${conflictStart} to ${conflictEnd}`
      );
    }
  }
}
