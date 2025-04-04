import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateRecurrencePatternDto, RecurrenceFrequency } from '../dto/create-recurrence-pattern.dto';
import { AppointmentService } from '../appointment.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';

/**
 * Service for handling recurring appointment patterns
 */
@Injectable()
export class RecurrencePatternService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly appointmentService: AppointmentService
  ) {}

  /**
   * Create a new recurrence pattern
   * @param createRecurrencePatternDto - Recurrence pattern data
   * @returns The created recurrence pattern
   */
  async create(createRecurrencePatternDto: CreateRecurrencePatternDto) {
    // Validate pattern
    this.validateRecurrencePattern(createRecurrencePatternDto);

    return this.prismaService.recurrencePattern.create({
      data: {
        frequency: createRecurrencePatternDto.frequency,
        interval: createRecurrencePatternDto.interval || 1,
        daysOfWeek: createRecurrencePatternDto.daysOfWeek,
        startDate: new Date(createRecurrencePatternDto.startDate),
        endDate: createRecurrencePatternDto.endDate 
          ? new Date(createRecurrencePatternDto.endDate) 
          : undefined,
        occurrenceCount: createRecurrencePatternDto.occurrenceCount
      }
    });
  }

  /**
   * Find a recurrence pattern by ID
   * @param id - Recurrence pattern ID
   * @returns The recurrence pattern
   */
  async findOne(id: bigint) {
    const pattern = await this.prismaService.recurrencePattern.findUnique({
      where: { id },
      include: {
        appointments: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    if (!pattern) {
      throw new NotFoundException(`Recurrence pattern with ID ${id} not found`);
    }

    return pattern;
  }

  /**
   * Generate appointment dates based on a recurrence pattern
   * @param baseDate - Base date to start from
   * @param pattern - Recurrence pattern
   * @param occurrenceCount - Maximum number of occurrences to generate
   * @returns Array of dates for recurring appointments
   */
  generateRecurringDates(
    baseDate: Date,
    pattern: CreateRecurrencePatternDto, 
    occurrenceCount: number = 10
  ): Date[] {
    const dates: Date[] = [];
    const startDate = new Date(pattern.startDate);
    const endDate = pattern.endDate ? new Date(pattern.endDate) : null;
    const interval = pattern.interval || 1;
    let count = 0;
    let maxCount = pattern.occurrenceCount || occurrenceCount;
    
    // Ensure maxCount is reasonable
    if (maxCount > 52) maxCount = 52; // Limit to 1 year of weekly appointments
    
    // Clone base date to avoid modifying the original
    let currentDate = new Date(baseDate);
    
    // Adjust to start date if base date is before start date
    if (currentDate < startDate) {
      currentDate = new Date(startDate);
    }
    
    while (count < maxCount && (!endDate || currentDate <= endDate)) {
      // Apply the recurrence pattern
      switch (pattern.frequency) {
        case RecurrenceFrequency.DAILY:
          if (count > 0) {
            currentDate.setDate(currentDate.getDate() + interval);
          }
          dates.push(new Date(currentDate));
          count++;
          break;

        case RecurrenceFrequency.WEEKLY:
        case RecurrenceFrequency.BIWEEKLY:
          if (count === 0) {
            // For the first occurrence, use the current date if it falls on a valid day
            const dayOfWeek = this.getDayAbbreviation(currentDate.getDay());
            const validDays = pattern.daysOfWeek ? JSON.parse(pattern.daysOfWeek) as string[] : [];
            
            if (validDays.length === 0 || validDays.includes(dayOfWeek)) {
              dates.push(new Date(currentDate));
              count++;
            }
            
            // Move to the next day, even if we didn't add a date
            currentDate.setDate(currentDate.getDate() + 1);
          } else if ((count > 0 && dates.length > 0) && (pattern.frequency === RecurrenceFrequency.BIWEEKLY) && (count % 7 === 0)) {
            // For biweekly, add an extra week after each complete week
            currentDate.setDate(currentDate.getDate() + (interval * 7));
          } else {
            // For weekly, just add the interval days
            currentDate.setDate(currentDate.getDate() + (pattern.frequency === RecurrenceFrequency.BIWEEKLY ? interval * 7 : 1));
          }
          
          // For weekly and biweekly, check if the day is in the specified days of week
          if (pattern.daysOfWeek) {
            const validDays = JSON.parse(pattern.daysOfWeek) as string[];
            const dayOfWeek = this.getDayAbbreviation(currentDate.getDay());
            
            if (validDays.includes(dayOfWeek)) {
              dates.push(new Date(currentDate));
              count++;
            }
          } else {
            // If no specific days are specified, use the same day of week as the base date
            if (currentDate.getDay() === baseDate.getDay()) {
              dates.push(new Date(currentDate));
              count++;
            }
          }
          break;
          
        case RecurrenceFrequency.MONTHLY:
          if (count > 0) {
            // Add months according to the interval
            const newMonth = currentDate.getMonth() + interval;
            const newYear = currentDate.getFullYear() + Math.floor(newMonth / 12);
            const adjustedMonth = newMonth % 12;
            
            currentDate = new Date(currentDate);
            currentDate.setFullYear(newYear, adjustedMonth);
            
            // Handle date overflow (e.g., Jan 31 -> Feb 28)
            const originalDay = baseDate.getDate();
            const maxDay = new Date(newYear, adjustedMonth + 1, 0).getDate();
            currentDate.setDate(Math.min(originalDay, maxDay));
          }
          
          dates.push(new Date(currentDate));
          count++;
          break;
          
        case RecurrenceFrequency.CUSTOM:
          // Custom handling is application-specific
          // Currently, just advance by the interval in days
          if (count > 0) {
            currentDate.setDate(currentDate.getDate() + interval);
          }
          dates.push(new Date(currentDate));
          count++;
          break;
      }
    }
    
    return dates;
  }

  /**
   * Generate recurring appointments from a template
   * @param baseAppointment - Base appointment data
   * @param recurrencePattern - Recurrence pattern
   * @param userId - ID of user creating appointments
   * @returns Array of created appointment IDs
   */
  async generateRecurringAppointments(
    baseAppointment: CreateAppointmentDto,
    recurrencePattern: CreateRecurrencePatternDto,
    userId: bigint
  ): Promise<bigint[]> {
    // Validate both the appointment and pattern
    this.validateRecurrencePattern(recurrencePattern);
    
    if (!baseAppointment.startTime || !baseAppointment.endTime) {
      throw new BadRequestException('Base appointment must have start and end times');
    }
    
    // Create recurrence pattern in database
    const pattern = await this.create(recurrencePattern);
    
    // Calculate appointment duration in milliseconds
    const baseStart = new Date(baseAppointment.startTime);
    const baseEnd = new Date(baseAppointment.endTime);
    const duration = baseEnd.getTime() - baseStart.getTime();
    
    if (duration <= 0) {
      throw new BadRequestException('Appointment end time must be after start time');
    }
    
    // Generate dates based on the pattern
    const recurringDates = this.generateRecurringDates(
      baseStart,
      recurrencePattern,
      recurrencePattern.occurrenceCount || 10
    );
    
    const appointmentIds: bigint[] = [];
    
    // Create each recurring appointment
    for (const date of recurringDates) {
      // Create end date by adding duration to start date
      const endDate = new Date(date.getTime() + duration);
      
      // Create appointment with the calculated dates
      const appointmentDto = { ...baseAppointment };
      appointmentDto.startTime = date.toISOString();
      appointmentDto.endTime = endDate.toISOString();
      appointmentDto.isRecurring = true;
      
      try {
        // Create the appointment and link it to the recurrence pattern
        const appointment = await this.prismaService.appointment.create({
          data: {
            startTime: date,
            endTime: endDate,
            title: appointmentDto.title,
            notes: appointmentDto.notes,
            status: appointmentDto.status,
            isGroupSession: appointmentDto.isGroupSession || false,
            maxParticipants: appointmentDto.maxParticipants,
            client: {
              connect: { id: BigInt(appointmentDto.clientId) }
            },
            learner: appointmentDto.learnerId ? {
              connect: { id: BigInt(appointmentDto.learnerId) }
            } : undefined,
            therapist: {
              connect: { id: BigInt(appointmentDto.therapistId) }
            },
            room: appointmentDto.roomId ? {
              connect: { id: BigInt(appointmentDto.roomId) }
            } : undefined,
            recurrencePattern: {
              connect: { id: pattern.id }
            },
            createdByUser: {
              connect: { id: userId }
            }
          }
        });
        
        // Store the ID of the created appointment
        appointmentIds.push(appointment.id);
        
        // Handle additional relationships (staff, equipment, participants)
        if (appointmentDto.staffAssignments && appointmentDto.staffAssignments.length > 0) {
          for (const staff of appointmentDto.staffAssignments) {
            await this.prismaService.appointmentStaff.create({
              data: {
                appointment: { connect: { id: appointment.id } },
                user: { connect: { id: BigInt(staff.userId) } },
                role: staff.role
              }
            });
          }
        }
        
        if (appointmentDto.equipmentAssignments && appointmentDto.equipmentAssignments.length > 0) {
          for (const equipment of appointmentDto.equipmentAssignments) {
            await this.prismaService.appointmentEquipment.create({
              data: {
                appointment: { connect: { id: appointment.id } },
                equipment: { connect: { id: BigInt(equipment.equipmentId) } },
                quantity: equipment.quantity || 1,
                notes: equipment.notes
              }
            });
          }
        }
        
        if (appointmentDto.isGroupSession && appointmentDto.groupParticipants && appointmentDto.groupParticipants.length > 0) {
          for (const participant of appointmentDto.groupParticipants) {
            await this.prismaService.appointmentGroupParticipant.create({
              data: {
                appointment: { connect: { id: appointment.id } },
                learner: { connect: { id: BigInt(participant.learnerId) } },
                notes: participant.notes
              }
            });
          }
        }
      } catch (error) {
        console.error('Error creating recurring appointment:', error);
        // Continue creating other appointments even if one fails
      }
    }
    
    return appointmentIds;
  }

  /**
   * Validate a recurrence pattern
   * @param pattern - Recurrence pattern to validate
   */
  private validateRecurrencePattern(pattern: CreateRecurrencePatternDto): void {
    if (!pattern.frequency) {
      throw new BadRequestException('Recurrence frequency is required');
    }
    
    if (!pattern.startDate) {
      throw new BadRequestException('Start date is required for recurrence pattern');
    }
    
    if (!pattern.endDate && !pattern.occurrenceCount) {
      throw new BadRequestException('Either end date or occurrence count must be specified');
    }
    
    if (pattern.endDate && pattern.startDate && new Date(pattern.endDate) <= new Date(pattern.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }
    
    if ((pattern.frequency === RecurrenceFrequency.WEEKLY || pattern.frequency === RecurrenceFrequency.BIWEEKLY) && !pattern.daysOfWeek) {
      throw new BadRequestException('Days of week must be specified for weekly and biweekly patterns');
    }
    
    if (pattern.daysOfWeek) {
      try {
        const days = JSON.parse(pattern.daysOfWeek);
        if (!Array.isArray(days)) {
          throw new BadRequestException('Days of week must be a JSON array');
        }
        
        const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        for (const day of days) {
          if (!validDays.includes(day)) {
            throw new BadRequestException(`Invalid day of week: ${day}`);
          }
        }
      } catch (e) {
        throw new BadRequestException('Days of week must be a valid JSON array');
      }
    }
  }

  /**
   * Get day of week abbreviation from day number
   * @param day - Day number (0-6, Sunday to Saturday)
   * @returns Day abbreviation
   */
  private getDayAbbreviation(day: number): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[day];
  }

  /**
   * Update a recurrence pattern and optionally affect future appointments
   * @param id - Recurrence pattern ID
   * @param updateDto - Updated recurrence pattern data
   * @param updateFutureAppointments - Whether to update future appointments
   * @returns Updated recurrence pattern
   */
  async update(
    id: bigint, 
    updateDto: Partial<CreateRecurrencePatternDto>,
    updateFutureAppointments: boolean = false
  ) {
    const pattern = await this.findOne(id);
    
    // Update pattern
    const updatedPattern = await this.prismaService.recurrencePattern.update({
      where: { id },
      data: {
        frequency: updateDto.frequency,
        interval: updateDto.interval,
        daysOfWeek: updateDto.daysOfWeek,
        startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
        occurrenceCount: updateDto.occurrenceCount
      }
    });
    
    // If requested, update future appointments based on the new pattern
    if (updateFutureAppointments) {
      // Get all appointments in this recurrence pattern
      const appointments = await this.prismaService.appointment.findMany({
        where: {
          recurrencePatternId: id,
          startTime: { gte: new Date() } // Only future appointments
        },
        orderBy: {
          startTime: 'asc'
        }
      });
      
      if (appointments.length > 0) {
        // Delete all future appointments
        await this.prismaService.appointment.deleteMany({
          where: {
            recurrencePatternId: id,
            startTime: { gte: new Date() }
          }
        });
        
        // Get the first appointment as a template
        const firstAppointment = appointments[0];
        
        // Re-generate appointments based on the updated pattern
        // This is a simplified approach - in a real application, you'd want to preserve
        // any custom changes made to individual recurrences
        const baseAppointment = {
          startTime: firstAppointment.startTime.toISOString(),
          endTime: firstAppointment.endTime.toISOString(),
          title: firstAppointment.title,
          notes: firstAppointment.notes,
          clientId: firstAppointment.clientId.toString(),
          learnerId: firstAppointment.learnerId?.toString(),
          therapistId: firstAppointment.therapistId.toString(),
          roomId: firstAppointment.roomId?.toString(),
          isGroupSession: firstAppointment.isGroupSession,
          status: firstAppointment.status,
          // Other fields would need to be fetched separately
        } as any; // Type as 'any' for simplicity
        
        // Generate new appointments
        // In a real implementation, you'd need to handle staff, equipment, participants
        this.generateRecurringAppointments(
          baseAppointment,
          {
            frequency: updatedPattern.frequency,
            interval: updatedPattern.interval,
            daysOfWeek: updatedPattern.daysOfWeek,
            startDate: updatedPattern.startDate.toISOString(),
            endDate: updatedPattern.endDate?.toISOString(),
            occurrenceCount: updatedPattern.occurrenceCount
          } as CreateRecurrencePatternDto,
          firstAppointment.createdById || BigInt(0)
        );
      }
    }
    
    return updatedPattern;
  }

  /**
   * Delete a recurrence pattern and optionally delete associated appointments
   * @param id - Recurrence pattern ID
   * @param deleteAppointments - Whether to delete associated appointments
   * @returns The deleted pattern
   */
  async remove(id: bigint, deleteAppointments: boolean = false) {
    const pattern = await this.findOne(id);
    
    if (deleteAppointments) {
      // Delete all associated appointments
      await this.prismaService.appointment.deleteMany({
        where: {
          recurrencePatternId: id
        }
      });
    } else {
      // Just unlink the pattern from appointments
      await this.prismaService.appointment.updateMany({
        where: {
          recurrencePatternId: id
        },
        data: {
          recurrencePatternId: null,
          isRecurring: false
        }
      });
    }
    
    // Delete the pattern
    return this.prismaService.recurrencePattern.delete({
      where: { id }
    });
  }
}
