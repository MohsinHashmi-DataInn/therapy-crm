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
    return this.prismaService.therapy_rooms.create({
      data: {
        name: createRoomDto.name,
        capacity: createRoomDto.capacity,
        description: createRoomDto.description,
        equipment: createRoomDto.equipment,
        is_active: createRoomDto.isActive ?? true,
        created_by: userId,
        updated_at: new Date()
      }
    });
  }

  /**
   * Get all therapy rooms
   * @param isActive - Optional filter for active rooms only
   * @returns List of therapy rooms
   */
  async findAllRooms(isActive?: boolean) {
    const where = isActive !== undefined ? { is_active: isActive } : {};
    
    return this.prismaService.therapy_rooms.findMany({
      where,
      include: {
        users_therapy_rooms_created_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        appointments: {
          select: {
            id: true,
            start_time: true,
            end_time: true
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
    const room = await this.prismaService.therapy_rooms.findUnique({
      where: { id },
      include: {
        appointments: {
          select: {
            id: true,
            start_time: true,
            end_time: true,
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

    return this.prismaService.therapy_rooms.update({
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
    const hasAppointments = await this.prismaService.appointments.findFirst({
      where: {
        room_id: id,
        start_time: {
          gte: new Date()
        }
      }
    });

    if (hasAppointments) {
      throw new BadRequestException('Cannot delete a room with future appointments');
    }

    return this.prismaService.therapy_rooms.delete({
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
    const conflictingAppointment = await this.prismaService.appointments.findFirst({
      where: {
        room_id: roomId,
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        OR: [
          // starts during the time slot
          {
            start_time: {
              gte: startTime,
              lt: endTime
            }
          },
          // ends during the time slot
          {
            end_time: {
              gt: startTime,
              lte: endTime
            }
          },
          // spans the entire time slot
          {
            start_time: {
              lte: startTime
            },
            end_time: {
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
    return this.prismaService.therapy_equipment.create({
      data: {
        name: createEquipmentDto.name,
        description: createEquipmentDto.description,
        quantity: createEquipmentDto.quantity ?? 1,
        is_available: createEquipmentDto.isAvailable ?? true,
        notes: createEquipmentDto.notes,
        created_by: userId,
        updated_at: new Date()
      }
    });
  }

  /**
   * Get all therapy equipment
   * @param isAvailable - Optional filter for available equipment only
   * @returns List of therapy equipment
   */
  async findAllEquipment(isAvailable?: boolean) {
    const where = isAvailable !== undefined ? { is_available: isAvailable } : {};
    
    return this.prismaService.therapy_equipment.findMany({
      where,
      include: {
        appointment_equipment: {
          select: {
            appointment_id: true,
            appointments: {
              select: {
                id: true,
                start_time: true,
                end_time: true
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
    const equipment = await this.prismaService.therapy_equipment.findUnique({
      where: { id },
      include: {
        appointment_equipment: {
          select: {
            appointment_id: true,
            appointments: {
              select: {
                id: true,
                start_time: true,
                end_time: true,
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

    return this.prismaService.therapy_equipment.update({
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
    const hasAppointmentUsage = await this.prismaService.appointment_equipment.findFirst({
      where: {
        equipment_id: id,
        appointments: {
          start_time: {
            gte: new Date()
          }
        }
      }
    });

    if (hasAppointmentUsage) {
      throw new BadRequestException('Cannot delete equipment used in future appointments');
    }

    return this.prismaService.therapy_equipment.delete({
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
    
    if (!equipment.is_available || equipment.quantity < quantity) {
      return false;
    }

    // Get total quantity used in overlapping appointments
    const usedQuantity = await this.prismaService.appointment_equipment.aggregate({
      _sum: {
        quantity: true
      },
      where: {
        equipment_id: equipmentId,
        appointments: {
          id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
          OR: [
            // starts during the time slot
            {
              start_time: {
                gte: startTime,
                lt: endTime
              }
            },
            // ends during the time slot
            {
              end_time: {
                gt: startTime,
                lte: endTime
              }
            },
            // spans the entire time slot
            {
              start_time: {
                lte: startTime
              },
              end_time: {
                gte: endTime
              }
            }
          ]
        }
      }
    });

    // Check if available quantity is sufficient
    const availableQuantity = equipment.quantity - ((usedQuantity?._sum?.quantity) || 0);
    return availableQuantity >= quantity;
}
}
