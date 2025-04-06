import { Injectable, NotFoundException, BadRequestException, ConflictException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAppointmentDto, AppointmentType, AppointmentStaffDto, AppointmentEquipmentDto, GroupParticipantDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Prisma } from '@prisma/client';
import { AppointmentStatus } from '../../types/prisma-models';
import { TherapyResourceService } from './services/therapy-resource.service';
import { RecurrencePatternService } from './services/recurrence-pattern.service';

export interface Appointment {
  id: bigint;
  start_time: Date;
  end_time: Date;
  type?: string;
  status: string;
  title?: string;
  notes?: string;
  location?: string;
  client_id?: bigint | null;
  learner_id?: bigint | null;
  therapist_id: bigint;
  created_at: Date;
  updated_at?: Date | null;
  created_by?: bigint | null;
  updated_by?: bigint | null;
  // Include relations for TypeScript purposes
  clients?: any;
  learners?: any;
  users_appointments_therapist_idTousers?: any;
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
    const client = await this.prismaService.clients.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createAppointmentDto.clientId} not found`);
    }

    if (createAppointmentDto.learnerId) {
      learnerId = BigInt(createAppointmentDto.learnerId);
      
      // Verify learner exists
      const learner = await this.prismaService.learners.findUnique({
        where: { id: learnerId },
      }) as unknown as { id: bigint; client_id: bigint };

      if (!learner) {
        throw new NotFoundException(`Learner with ID ${createAppointmentDto.learnerId} not found`);
      }

      // If client ID not provided, get it from learner
      if (!clientId) {
        clientId = learner.client_id;
      }
    }

    // Verify therapist exists
    const therapist = await this.prismaService.users.findUnique({
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
    const appointment = await this.prismaService.appointments.create({
      data: {
        start_time: startTime,
        end_time: endTime,
        status: createAppointmentDto.status || AppointmentStatus.SCHEDULED,
        title: createAppointmentDto.title,
        notes: createAppointmentDto.notes,
        location: createAppointmentDto.location,
        client_id: clientId,
        learner_id: learnerId,
        therapist_id: therapistId,
        updated_at: new Date(),
        created_by: userId,
        updated_by: userId,
        is_recurring: createAppointmentDto.isRecurring || false,
        is_group_session: createAppointmentDto.isGroupSession || false,
        max_participants: createAppointmentDto.maxParticipants,
        room_id: createAppointmentDto.roomId ? BigInt(createAppointmentDto.roomId) : null,
      },
      include: {
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        learners: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_appointments_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    }) as unknown as Appointment;
    
    return appointment;
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

      // Add date range filters if provided
    if (startDate || endDate) {
      where.start_time = {};
      
      if (startDate) {
        where.start_time.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.start_time.lte = new Date(endDate);
      }
    }

    // Add other filters if provided
    if (therapistId) {
      where.therapist_id = BigInt(therapistId);
    }

    if (clientId) {
      where.client_id = BigInt(clientId);
    }

    if (learnerId) {
      where.learner_id = BigInt(learnerId);
    }

    if (status) {
      where.status = status;
    }

    return this.prismaService.appointments.findMany({
      where,
      include: {
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        learners: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_appointments_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        start_time: 'asc',
      },
    }) as unknown as Appointment[];
  }

  /**
   * Remove an appointment
   * @param id - Appointment ID
   * @returns The removed appointment
   */
    /**
   * Find an appointment by ID
   * @param id - Appointment ID
   * @returns The found appointment
   */
  async findOne(id: bigint): Promise<Appointment> {
    const appointment = await this.prismaService.appointments.findUnique({
      where: { id },
      include: {
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        learners: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_appointments_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
    
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment as unknown as Appointment;
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
    // Find appointment to ensure it exists
    await this.findOne(id);

    // Extract data from DTO
    const {
      startTime,
      endTime,
      clientId,
      learnerId,
      therapistId,
      location,
      roomId,
      // Remove locationId if it doesn't exist in UpdateAppointmentDto
      ...rest
    } = updateAppointmentDto;

    // Convert to Date objects if provided
    const updatedStartTime = startTime ? new Date(startTime) : undefined;
    const updatedEndTime = endTime ? new Date(endTime) : undefined;

    // Check for appointment conflicts if both date fields are provided
    if (updatedStartTime && updatedEndTime && therapistId) {
      await this.checkForAppointmentConflicts(
        BigInt(therapistId),
        id, // Exclude current appointment from conflict check
        updatedStartTime,
        updatedEndTime
      );
    }

    // Build the update data
    const updateData: any = {
      ...rest,
      updated_at: new Date(),
      updated_by: userId,
    };

    // Add optional fields if they are provided
    if (updatedStartTime) updateData.start_time = updatedStartTime;
    if (updatedEndTime) updateData.end_time = updatedEndTime;
    if (clientId !== undefined) updateData.client_id = clientId ? BigInt(clientId) : null;
    if (learnerId !== undefined) updateData.learner_id = learnerId ? BigInt(learnerId) : null;
    if (therapistId) updateData.therapist_id = BigInt(therapistId);
    if (location !== undefined) updateData.location = location;
    if (roomId !== undefined) updateData.room_id = roomId ? BigInt(roomId) : null;

    // Update the appointment
    return this.prismaService.appointments.update({
      where: { id },
      data: updateData,
      include: {
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        learners: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_appointments_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
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
  return this.prismaService.appointments.delete({
    where: { id },
    include: {
      clients: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
        },
      },
      learners: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      users_appointments_therapist_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  }) as unknown as Appointment;
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
      therapist_id: therapistId,
      status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED] },
      OR: [
        {
          // Case 1: New appointment starts during an existing appointment
          start_time: { lt: endTime },
          end_time: { gt: startTime },
        },
        {
          // Case 2: New appointment contains an existing appointment
          start_time: { gte: startTime },
          end_time: { lte: endTime },
        },
      ],
    };

    // Exclude the current appointment if updating
    if (excludeAppointmentId) {
      whereCondition.id = { not: excludeAppointmentId };
    }

    // Find conflicting appointments
    const conflictingAppointments = await this.prismaService.appointments.findMany({
      where: whereCondition,
      select: {
        id: true,
        start_time: true,
        end_time: true,
        title: true,
        users_appointments_therapist_idTousers: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });
    
    // Throw error if conflicts found
    if (conflictingAppointments.length > 0) {
      const conflict = conflictingAppointments[0] as unknown as {
        id: bigint;
        start_time: Date;
        end_time: Date;
        title: string;
        users_appointments_therapist_idTousers: {
          first_name: string;
          last_name: string;
        };
      };
      
      const conflictStart = conflict.start_time.toLocaleTimeString();
      const conflictEnd = conflict.end_time.toLocaleTimeString();
      const therapistName = `${conflict.users_appointments_therapist_idTousers.first_name} ${conflict.users_appointments_therapist_idTousers.last_name}`;
      
      throw new ConflictException(
        `Appointment conflicts with existing appointment for ${therapistName} from ${conflictStart} to ${conflictEnd}`
      );
    }
  }
}
