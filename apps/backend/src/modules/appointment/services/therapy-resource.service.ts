import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateTherapyRoomDto } from '../dto/create-therapy-room.dto';
import { CreateTherapyEquipmentDto } from '../dto/create-therapy-equipment.dto';

/**
 * Service handling therapy resources (rooms and equipment)
 */
@Injectable()
export class TherapyResourceService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new therapy room
   * @param createRoomDto - Room data
   * @param userId - User ID creating the room
   * @returns The created therapy room
   */
  async createRoom(createRoomDto: CreateTherapyRoomDto, userId: bigint) {
    return this.prismaService.therapyRoom.create({
      data: {
        name: createRoomDto.name,
        capacity: createRoomDto.capacity,
        description: createRoomDto.description,
        equipment: createRoomDto.equipment,
        isActive: createRoomDto.isActive ?? true,
        createdByUser: {
          connect: { id: userId }
        }
      }
    });
  }

  /**
   * Get all therapy rooms
   * @param isActive - Optional filter for active rooms only
   * @returns List of therapy rooms
   */
  async findAllRooms(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};
    
    return this.prismaService.therapyRoom.findMany({
      where,
      include: {
        appointments: {
          select: {
            id: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });
  }

  /**
   * Get a therapy room by ID
   * @param id - Room ID
   * @returns The therapy room
   */
  async findRoomById(id: bigint) {
    const room = await this.prismaService.therapyRoom.findUnique({
      where: { id },
      include: {
        appointments: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            title: true
          }
        }
      }
    });

    if (!room) {
      throw new NotFoundException(`Therapy room with ID ${id} not found`);
    }

    return room;
  }

  /**
   * Update a therapy room
   * @param id - Room ID
   * @param updateData - Room update data
   * @returns The updated room
   */
  async updateRoom(id: bigint, updateData: Partial<CreateTherapyRoomDto>) {
    await this.findRoomById(id);

    return this.prismaService.therapyRoom.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Delete a therapy room
   * @param id - Room ID
   * @returns The deleted room
   */
  async removeRoom(id: bigint) {
    await this.findRoomById(id);

    // Check if room has any future appointments
    const hasAppointments = await this.prismaService.appointment.findFirst({
      where: {
        roomId: id,
        startTime: {
          gte: new Date()
        }
      }
    });

    if (hasAppointments) {
      throw new BadRequestException('Cannot delete a room with future appointments');
    }

    return this.prismaService.therapyRoom.delete({
      where: { id }
    });
  }

  /**
   * Check room availability for a time slot
   * @param roomId - Room ID
   * @param startTime - Start time
   * @param endTime - End time
   * @param excludeAppointmentId - Optional appointment ID to exclude
   * @returns Whether the room is available
   */
  async checkRoomAvailability(
    roomId: bigint,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: bigint
  ): Promise<boolean> {
    // Ensure room exists
    await this.findRoomById(roomId);

    // Check for overlapping appointments
    const conflictingAppointment = await this.prismaService.appointment.findFirst({
      where: {
        roomId,
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        OR: [
          // starts during the time slot
          {
            startTime: {
              gte: startTime,
              lt: endTime
            }
          },
          // ends during the time slot
          {
            endTime: {
              gt: startTime,
              lte: endTime
            }
          },
          // spans the entire time slot
          {
            startTime: {
              lte: startTime
            },
            endTime: {
              gte: endTime
            }
          }
        ]
      }
    });

    return !conflictingAppointment;
  }

  /**
   * Create new therapy equipment
   * @param createEquipmentDto - Equipment data
   * @param userId - User ID creating the equipment
   * @returns The created equipment
   */
  async createEquipment(createEquipmentDto: CreateTherapyEquipmentDto, userId: bigint) {
    return this.prismaService.therapyEquipment.create({
      data: {
        name: createEquipmentDto.name,
        description: createEquipmentDto.description,
        quantity: createEquipmentDto.quantity ?? 1,
        isAvailable: createEquipmentDto.isAvailable ?? true,
        notes: createEquipmentDto.notes,
        createdByUser: {
          connect: { id: userId }
        }
      }
    });
  }

  /**
   * Get all therapy equipment
   * @param isAvailable - Optional filter for available equipment only
   * @returns List of therapy equipment
   */
  async findAllEquipment(isAvailable?: boolean) {
    const where = isAvailable !== undefined ? { isAvailable } : {};
    
    return this.prismaService.therapyEquipment.findMany({
      where,
      include: {
        appointmentEquipment: {
          select: {
            id: true,
            appointment: {
              select: {
                id: true,
                startTime: true,
                endTime: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get therapy equipment by ID
   * @param id - Equipment ID
   * @returns The therapy equipment
   */
  async findEquipmentById(id: bigint) {
    const equipment = await this.prismaService.therapyEquipment.findUnique({
      where: { id },
      include: {
        appointmentEquipment: {
          select: {
            id: true,
            appointment: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!equipment) {
      throw new NotFoundException(`Therapy equipment with ID ${id} not found`);
    }

    return equipment;
  }

  /**
   * Update therapy equipment
   * @param id - Equipment ID
   * @param updateData - Equipment update data
   * @returns The updated equipment
   */
  async updateEquipment(id: bigint, updateData: Partial<CreateTherapyEquipmentDto>) {
    await this.findEquipmentById(id);

    return this.prismaService.therapyEquipment.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Delete therapy equipment
   * @param id - Equipment ID
   * @returns The deleted equipment
   */
  async removeEquipment(id: bigint) {
    await this.findEquipmentById(id);

    // Check if equipment is used in any future appointments
    const hasAppointments = await this.prismaService.appointmentEquipment.findFirst({
      where: {
        equipmentId: id,
        appointment: {
          startTime: {
            gte: new Date()
          }
        }
      }
    });

    if (hasAppointments) {
      throw new BadRequestException('Cannot delete equipment used in future appointments');
    }

    return this.prismaService.therapyEquipment.delete({
      where: { id }
    });
  }

  /**
   * Check equipment availability for a time slot
   * @param equipmentId - Equipment ID
   * @param startTime - Start time
   * @param endTime - End time
   * @param quantity - Quantity needed
   * @param excludeAppointmentId - Optional appointment ID to exclude
   * @returns Whether the equipment is available in the requested quantity
   */
  async checkEquipmentAvailability(
    equipmentId: bigint,
    startTime: Date,
    endTime: Date,
    quantity: number = 1,
    excludeAppointmentId?: bigint
  ): Promise<boolean> {
    // Get equipment
    const equipment = await this.findEquipmentById(equipmentId);
    
    if (!equipment.isAvailable || equipment.quantity < quantity) {
      return false;
    }

    // Get total quantity used in overlapping appointments
    const usedQuantity = await this.prismaService.appointmentEquipment.aggregate({
      _sum: {
        quantity: true
      },
      where: {
        equipmentId,
        appointment: {
          id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
          OR: [
            // starts during the time slot
            {
              startTime: {
                gte: startTime,
                lt: endTime
              }
            },
            // ends during the time slot
            {
              endTime: {
                gt: startTime,
                lte: endTime
              }
            },
            // spans the entire time slot
            {
              startTime: {
                lte: startTime
              },
              endTime: {
                gte: endTime
              }
            }
          ]
        }
      }
    });

    const totalUsed = usedQuantity._sum.quantity || 0;
    return equipment.quantity - totalUsed >= quantity;
  }
}
