import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  UpdateAppointmentStatusDto,
  CreateAttendanceRecordDto 
} from './dto/appointment.dto';
import { Appointment, AppointmentStatus, AttendanceStatus } from '@prisma/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new appointment
   * @param createAppointmentDto - Appointment data
   * @returns Newly created appointment
   */
  async create(createAppointmentDto: CreateAppointmentDto) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: createAppointmentDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createAppointmentDto.clientId} not found`);
    }

    // If learner ID is provided, verify learner exists
    if (createAppointmentDto.learnerId) {
      const learner = await this.prisma.learner.findUnique({
        where: { id: createAppointmentDto.learnerId },
      });

      if (!learner) {
        throw new NotFoundException(`Learner with ID ${createAppointmentDto.learnerId} not found`);
      }

      // Verify learner belongs to the client
      if (learner.clientId !== createAppointmentDto.clientId) {
        throw new BadRequestException('Learner does not belong to the specified client');
      }
    }

    // Validate appointment times
    const startTime = new Date(createAppointmentDto.startTime);
    const endTime = new Date(createAppointmentDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Create appointment with initial status history
    return this.prisma.$transaction(async (prisma) => {
      const appointment = await prisma.appointment.create({
        data: {
          title: createAppointmentDto.title,
          startTime,
          endTime,
          status: createAppointmentDto.status || AppointmentStatus.PENDING,
          notes: createAppointmentDto.notes,
          location: createAppointmentDto.location,
          reminderSent: createAppointmentDto.reminderSent || false,
          clientId: createAppointmentDto.clientId,
          learnerId: createAppointmentDto.learnerId,
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
          learner: createAppointmentDto.learnerId ? {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              course: true,
            },
          } : false,
        },
      });

      // Record initial status in history
      await prisma.statusHistory.create({
        data: {
          appointmentId: appointment.id,
          previousStatus: null,
          newStatus: appointment.status,
          notes: 'Initial appointment creation',
        },
      });

      return appointment;
    });
  }

  /**
   * Find all appointments with optional filtering
   * @param options - Filter options
   * @returns List of appointments
   */
  async findAll(options: {
    startDate?: string;
    endDate?: string;
    status?: string;
    clientId?: string;
    learnerId?: string;
  }) {
    const { startDate, endDate, status, clientId, learnerId } = options;

    // Build where clause based on provided filters
    const where: any = {};

    if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.startTime = { 
        ...(where.startTime || {}),
        lte: new Date(endDate)
      };
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (learnerId) {
      where.learnerId = learnerId;
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
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
            course: true,
          },
        },
        attendanceRecord: true,
      },
    });
  }

  /**
   * Find an appointment by ID
   * @param id - Appointment ID
   * @returns Appointment with related data
   * @throws NotFoundException if appointment not found
   */
  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        learner: true,
        attendanceRecord: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  /**
   * Update an appointment
   * @param id - Appointment ID
   * @param updateAppointmentDto - Updated appointment data
   * @returns Updated appointment
   * @throws NotFoundException if appointment not found
   */
  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    // Get current appointment to check if status is changing
    const currentAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // If client ID is provided, verify client exists
    if (updateAppointmentDto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: updateAppointmentDto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${updateAppointmentDto.clientId} not found`);
      }
    }

    // If learner ID is provided, verify learner exists and belongs to the client
    if (updateAppointmentDto.learnerId) {
      const learner = await this.prisma.learner.findUnique({
        where: { id: updateAppointmentDto.learnerId },
      });

      if (!learner) {
        throw new NotFoundException(`Learner with ID ${updateAppointmentDto.learnerId} not found`);
      }

      // If client ID is also being updated, check against that
      if (updateAppointmentDto.clientId && learner.clientId !== updateAppointmentDto.clientId) {
        throw new BadRequestException('Learner does not belong to the specified client');
      }
    }

    // Validate appointment times if both are provided
    if (updateAppointmentDto.startTime && updateAppointmentDto.endTime) {
      const startTime = new Date(updateAppointmentDto.startTime);
      const endTime = new Date(updateAppointmentDto.endTime);

      if (startTime >= endTime) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    // Check if status is changing
    const isStatusChanging = updateAppointmentDto.status && 
                            updateAppointmentDto.status !== currentAppointment.status;

    return this.prisma.$transaction(async (prisma) => {
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          title: updateAppointmentDto.title,
          startTime: updateAppointmentDto.startTime ? new Date(updateAppointmentDto.startTime) : undefined,
          endTime: updateAppointmentDto.endTime ? new Date(updateAppointmentDto.endTime) : undefined,
          status: updateAppointmentDto.status,
          notes: updateAppointmentDto.notes,
          location: updateAppointmentDto.location,
          reminderSent: updateAppointmentDto.reminderSent,
          clientId: updateAppointmentDto.clientId,
          learnerId: updateAppointmentDto.learnerId,
        },
        include: {
          client: true,
          learner: true,
          attendanceRecord: true,
        },
      });

      // If status changed, record in history
      if (isStatusChanging) {
        await prisma.statusHistory.create({
          data: {
            appointmentId: id,
            previousStatus: currentAppointment.status,
            newStatus: updateAppointmentDto.status!,
            notes: 'Status updated during appointment edit',
          },
        });
      }

      return updatedAppointment;
    });
  }

  /**
   * Remove an appointment
   * @param id - Appointment ID
   * @returns Removed appointment
   * @throws NotFoundException if appointment not found
   */
  async remove(id: string) {
    try {
      return await this.prisma.appointment.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
  }

  /**
   * Update appointment status
   * @param id - Appointment ID
   * @param updateStatusDto - Status update data
   * @returns Updated appointment
   * @throws NotFoundException if appointment not found
   */
  async updateStatus(id: string, updateStatusDto: UpdateAppointmentStatusDto) {
    const currentAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update appointment status
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: updateStatusDto.status,
        },
        include: {
          client: true,
          learner: true,
          attendanceRecord: true,
        },
      });

      // Record status change in history
      await prisma.statusHistory.create({
        data: {
          appointmentId: id,
          previousStatus: currentAppointment.status,
          newStatus: updateStatusDto.status,
          notes: updateStatusDto.notes || 'Status updated',
        },
      });

      // If status is COMPLETED or NO_SHOW and there's no attendance record yet,
      // automatically create one
      if (
        (updateStatusDto.status === AppointmentStatus.COMPLETED || 
         updateStatusDto.status === AppointmentStatus.NO_SHOW) && 
        !updatedAppointment.attendanceRecord &&
        updatedAppointment.learnerId
      ) {
        const attendanceStatus = updateStatusDto.status === AppointmentStatus.COMPLETED 
          ? AttendanceStatus.PRESENT 
          : AttendanceStatus.NO_SHOW;

        await prisma.attendanceRecord.create({
          data: {
            appointmentId: id,
            learnerId: updatedAppointment.learnerId,
            status: attendanceStatus,
            notes: `Automatically recorded based on appointment status change to ${updateStatusDto.status}`,
          },
        });
      }

      return updatedAppointment;
    });
  }

  /**
   * Find all appointments for a specific client
   * @param clientId - Client ID
   * @returns List of appointments for the client
   */
  async findByClient(clientId: string) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return this.prisma.appointment.findMany({
      where: { clientId },
      orderBy: { startTime: 'asc' },
      include: {
        learner: true,
        attendanceRecord: true,
      },
    });
  }

  /**
   * Find all appointments for a specific learner
   * @param learnerId - Learner ID
   * @returns List of appointments for the learner
   */
  async findByLearner(learnerId: string) {
    // Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${learnerId} not found`);
    }

    return this.prisma.appointment.findMany({
      where: { learnerId },
      orderBy: { startTime: 'asc' },
      include: {
        client: true,
        attendanceRecord: true,
      },
    });
  }

  /**
   * Get appointments for calendar view
   * @param year - Year
   * @param month - Month (1-12)
   * @param day - Optional day for day view
   * @param view - Calendar view type (month, week, day)
   * @returns Appointments for the specified calendar view
   */
  async getCalendarView(
    year: number,
    month: number, // 1-12
    day?: number,
    view: 'month' | 'week' | 'day' = 'month',
  ) {
    // Adjust month to 0-11 for JavaScript Date
    const jsMonth = month - 1;
    
    let startDate: Date;
    let endDate: Date;

    if (view === 'month') {
      // Month view: get all appointments in the month
      startDate = startOfMonth(new Date(year, jsMonth));
      endDate = endOfMonth(new Date(year, jsMonth));
    } else if (view === 'week' && day) {
      // Week view: get all appointments in the week containing the specified day
      startDate = startOfWeek(new Date(year, jsMonth, day));
      endDate = endOfWeek(new Date(year, jsMonth, day));
    } else if (view === 'day' && day) {
      // Day view: get all appointments on the specified day
      startDate = startOfDay(new Date(year, jsMonth, day));
      endDate = endOfDay(new Date(year, jsMonth, day));
    } else {
      throw new BadRequestException('Invalid calendar view parameters');
    }

    return this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Record attendance for an appointment
   * @param createAttendanceDto - Attendance data
   * @returns Created attendance record
   */
  async recordAttendance(createAttendanceDto: CreateAttendanceRecordDto) {
    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: createAttendanceDto.appointmentId },
      include: {
        attendanceRecord: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${createAttendanceDto.appointmentId} not found`);
    }

    // Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: createAttendanceDto.learnerId },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${createAttendanceDto.learnerId} not found`);
    }

    // Check if attendance record already exists
    if (appointment.attendanceRecord) {
      // Update existing record
      return this.prisma.attendanceRecord.update({
        where: { id: appointment.attendanceRecord.id },
        data: {
          status: createAttendanceDto.status as AttendanceStatus,
          notes: createAttendanceDto.notes,
          recordedAt: new Date(),
        },
        include: {
          appointment: true,
          learner: true,
        },
      });
    } else {
      // Create new record
      return this.prisma.attendanceRecord.create({
        data: {
          appointmentId: createAttendanceDto.appointmentId,
          learnerId: createAttendanceDto.learnerId,
          status: createAttendanceDto.status as AttendanceStatus,
          notes: createAttendanceDto.notes,
        },
        include: {
          appointment: true,
          learner: true,
        },
      });
    }
  }

  /**
   * Get status history for an appointment
   * @param appointmentId - Appointment ID
   * @returns Status history records
   */
  async getStatusHistory(appointmentId: string) {
    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
    }

    return this.prisma.statusHistory.findMany({
      where: { appointmentId },
      orderBy: { changedAt: 'desc' },
    });
  }
}
