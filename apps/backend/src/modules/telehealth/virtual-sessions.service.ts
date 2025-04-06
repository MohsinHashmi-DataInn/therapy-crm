import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVirtualSessionDto } from './dto/create-virtual-session.dto';
import { UpdateVirtualSessionDto } from './dto/update-virtual-session.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { createTypedPrismaClient } from '../../common/prisma/prisma.types';
import { TelehealthException } from './exceptions/telehealth-exception';

/**
 * Service for managing virtual therapy sessions
 */
@Injectable()
export class VirtualSessionsService {
  constructor(private readonly prisma: PrismaService) {
    // Convert PrismaService to TypedPrismaClient to ensure type safety
    this.typedPrisma = createTypedPrismaClient(this.prisma);
  }
  
  // Typed version of the Prisma client with proper model definitions
  private readonly typedPrisma;

  /**
   * Create a new virtual session
   * @param createVirtualSessionDto - Data for creating a virtual session
   * @param userId - ID of the user creating the session
   * @returns The created virtual session
   */
  async create(createVirtualSessionDto: CreateVirtualSessionDto, userId: bigint) {
    // Verify provider exists
    const provider = await this.typedPrisma.telehealth_providers.findUnique({
      where: { id: BigInt(createVirtualSessionDto.provider_id) },
    });

    if (!provider) {
      throw TelehealthException.providerNotFound(createVirtualSessionDto.provider_id);
    }

    // Verify client exists if provided
    if (createVirtualSessionDto.client_id) {
      const client = await this.prisma.clients.findUnique({
        where: { id: BigInt(createVirtualSessionDto.client_id) },
      });

      if (!client) {
        throw TelehealthException.clientNotFound(createVirtualSessionDto.client_id);
      }
    }

    // Create the session
    return await this.typedPrisma.virtual_sessions.create({
      data: {
        title: createVirtualSessionDto.title,
        description: createVirtualSessionDto.description,
        scheduled_start: new Date(createVirtualSessionDto.scheduled_start),
        scheduled_end: new Date(createVirtualSessionDto.scheduled_end),
        status: createVirtualSessionDto.status || 'SCHEDULED',
        access_code: createVirtualSessionDto.access_code,
        provider_id: BigInt(createVirtualSessionDto.provider_id),
        therapist_id: BigInt(createVirtualSessionDto.therapist_id || userId.toString()),
        client_id: createVirtualSessionDto.client_id 
          ? BigInt(createVirtualSessionDto.client_id) 
          : null,
        meeting_id: createVirtualSessionDto.meeting_id,
        meeting_url: createVirtualSessionDto.meeting_url,
        host_url: createVirtualSessionDto.host_url,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        telehealth_providers: true,
        users_virtual_sessions_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        clients: createVirtualSessionDto.client_id ? {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        } : false,
      },
    });
  }

  /**
   * Find all virtual sessions with optional filters
   * @param filters - Optional filters for status, date range, therapist, client
   * @returns List of virtual sessions
   */
  async findAll(filters: {
    status?: string;
    from?: Date;
    to?: Date;
    therapistId?: bigint;
    clientId?: bigint;
  } = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.from) {
      where.scheduled_start = {
        ...(where.scheduled_start || {}),
        gte: filters.from,
      };
    }

    if (filters.to) {
      where.scheduled_end = {
        ...(where.scheduled_end || {}),
        lte: filters.to,
      };
    }

    if (filters.therapistId) {
      where.therapist_id = filters.therapistId;
    }

    if (filters.clientId) {
      where.client_id = filters.clientId;
    }

    return await this.typedPrisma.virtual_sessions.findMany({
      where,
      include: {
        telehealth_providers: {
          select: {
            id: true,
            name: true,
            provider_type: true,
            logo_url: true,
          },
        },
        users_virtual_sessions_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        virtual_session_participants: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        virtual_session_recordings: true,
      },
      orderBy: {
        scheduled_start: 'asc',
      },
    });
  }

  /**
   * Find one virtual session by ID
   * @param id - Virtual session ID
   * @returns The virtual session
   * @throws NotFoundException if session not found
   */
  async findOne(id: bigint) {
    const session = await this.typedPrisma.virtual_sessions.findUnique({
      where: { id },
      include: {
        telehealth_providers: true,
        users_virtual_sessions_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        virtual_session_participants: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        virtual_session_recordings: true,
      },
    });

    if (!session) {
      throw TelehealthException.sessionNotFound(id);
    }

    return session;
  }

  /**
   * Update a virtual session
   * @param id - Virtual session ID
   * @param updateVirtualSessionDto - Updated data
   * @param userId - ID of the user updating the session
   * @returns The updated virtual session
   * @throws NotFoundException if session not found
   */
  async update(id: bigint, updateVirtualSessionDto: UpdateVirtualSessionDto, userId: bigint) {
    // Verify provider exists if being updated
    if (updateVirtualSessionDto.provider_id) {
      const provider = await this.typedPrisma.telehealth_providers.findUnique({
        where: { id: BigInt(updateVirtualSessionDto.provider_id) },
      });

      if (!provider) {
        throw TelehealthException.providerNotFound(updateVirtualSessionDto.provider_id);
      }
    }

    // Verify client exists if provided
    if (updateVirtualSessionDto.client_id) {
      const client = await this.prisma.clients.findUnique({
        where: { id: BigInt(updateVirtualSessionDto.client_id) },
      });

      if (!client) {
        throw TelehealthException.clientNotFound(updateVirtualSessionDto.client_id);
      }
    }

    try {
      return await this.typedPrisma.virtual_sessions.update({
        where: { id },
        data: {
          title: updateVirtualSessionDto.title,
          description: updateVirtualSessionDto.description,
          scheduled_start: updateVirtualSessionDto.scheduled_start 
            ? new Date(updateVirtualSessionDto.scheduled_start) 
            : undefined,
          scheduled_end: updateVirtualSessionDto.scheduled_end 
            ? new Date(updateVirtualSessionDto.scheduled_end) 
            : undefined,
          status: updateVirtualSessionDto.status,
          access_code: updateVirtualSessionDto.access_code,
          provider_id: updateVirtualSessionDto.provider_id 
            ? BigInt(updateVirtualSessionDto.provider_id) 
            : undefined,
          therapist_id: updateVirtualSessionDto.therapist_id 
            ? BigInt(updateVirtualSessionDto.therapist_id) 
            : undefined,
          client_id: updateVirtualSessionDto.client_id 
            ? BigInt(updateVirtualSessionDto.client_id) 
            : undefined,
          meeting_id: updateVirtualSessionDto.meeting_id,
          meeting_url: updateVirtualSessionDto.meeting_url,
          host_url: updateVirtualSessionDto.host_url,
          updated_at: new Date(),
          updated_by: userId,
        },
        include: {
          telehealth_providers: true,
          users_virtual_sessions_therapist_idTousers: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          clients: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          virtual_session_participants: {
            include: {
              users: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw TelehealthException.sessionNotFound(id);
      }
      throw error;
    }
  }

  /**
   * Remove a virtual session
   * @param id - Virtual session ID
   * @returns The deleted virtual session
   * @throws NotFoundException if session not found
   */
  async remove(id: bigint) {
    // First delete related records
    await this.prisma.$transaction([
      await this.typedPrisma.virtual_session_participants.deleteMany({
        where: { session_id: id },
      }),
      await this.typedPrisma.virtual_session_recordings.deleteMany({
        where: { session_id: id },
      }),
    ]);

    try {
      return await this.typedPrisma.virtual_sessions.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw TelehealthException.sessionNotFound(id);
      }
      throw error;
    }
  }

  /**
   * Start a virtual session
   * @param id - Virtual session ID
   * @returns The updated session
   * @throws NotFoundException if session not found
   * @throws BadRequestException if session is not in a valid state to start
   */
  async startSession(id: bigint) {
    const session = await this.findOne(id);

    if (!session) {
      throw TelehealthException.sessionNotFound(id);
    }

    if (session.status !== 'SCHEDULED') {
      throw TelehealthException.invalidSessionStatus(id, session.status, 'start');
    }

    return await (this.prisma as any).virtual_sessions.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actual_start: new Date(),
        updated_at: new Date(),
      },
      include: {
        telehealth_providers: true,
        users_virtual_sessions_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * End a virtual session
   * @param id - Virtual session ID
   * @returns The updated session
   * @throws NotFoundException if session not found
   * @throws BadRequestException if session is not in a valid state to end
   */
  async endSession(id: bigint) {
    const session = await this.findOne(id);

    if (!session) {
      throw TelehealthException.sessionNotFound(id);
    }

    if (session.status !== 'IN_PROGRESS') {
      throw TelehealthException.invalidSessionStatus(id, session.status, 'end');
    }

    return await (this.prisma as any).virtual_sessions.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actual_end: new Date(),
        updated_at: new Date(),
      },
      include: {
        telehealth_providers: true,
        users_virtual_sessions_therapist_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Add a participant to a virtual session
   * @param sessionId - Virtual session ID
   * @param addParticipantDto - Participant data
   * @returns The added participant
   * @throws NotFoundException if session not found
   */
  async addParticipant(sessionId: bigint, addParticipantDto: AddParticipantDto) {
    const session = await this.findOne(sessionId);

    if (!session) {
      throw TelehealthException.sessionNotFound(sessionId);
    }

    // Check if user exists
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(addParticipantDto.user_id) },
    });

    if (!user) {
      throw TelehealthException.userNotFound(addParticipantDto.user_id);
    }

    // Check if participant already exists
    const participant = await this.typedPrisma.virtual_session_participants.findUnique({
      where: {
        session_id: sessionId,
        user_id: BigInt(addParticipantDto.user_id),
      },
    });

    if (participant) {
      return participant; // Participant already added
    }

    return await this.typedPrisma.virtual_session_participants.create({
      data: {
        session_id: sessionId,
        user_id: BigInt(addParticipantDto.user_id),
        join_url: addParticipantDto.join_url,
        participant_role: addParticipantDto.participant_role || 'ATTENDEE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        virtual_sessions: true,
      },
    });
  }

  /**
   * Remove a participant from a virtual session
   * @param sessionId - Virtual session ID
   * @param participantId - Participant ID
   * @returns The removed participant
   * @throws NotFoundException if session or participant not found
   */
  async removeParticipant(sessionId: bigint, participantId: bigint) {
    const session = await this.findOne(sessionId);

    if (!session) {
      throw TelehealthException.sessionNotFound(sessionId);
    }

    try {
      return await this.typedPrisma.virtual_session_participants.delete({
        where: {
          id: participantId,
          session_id: sessionId,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw TelehealthException.participantNotFound(participantId, sessionId);
      }
      throw error;
    }
  }

  /**
   * Add a recording to a virtual session
   * @param sessionId - Virtual session ID
   * @param recordingUrl - URL of the recording
   * @param recordingType - Type of recording
   * @param userId - ID of the user adding the recording
   * @returns The added recording
   * @throws NotFoundException if session not found
   */
  async addRecording(
    sessionId: bigint,
    recordingUrl: string,
    recordingType: string,
    userId: bigint,
  ) {
    const session = await this.findOne(sessionId);

    if (!session) {
      throw TelehealthException.sessionNotFound(sessionId);
    }

    return await this.typedPrisma.virtual_session_recordings.create({
      data: {
        session_id: sessionId,
        recording_url: recordingUrl,
        recording_type: recordingType,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        virtual_sessions: true,
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get join information for a virtual session
   * @param sessionId - Virtual session ID
   * @param userId - ID of the user requesting join info
   * @returns Join information for the session
   * @throws NotFoundException if session not found
   * @throws ForbiddenException if user is not authorized to join
   */
  async getJoinInfo(sessionId: bigint, userId: bigint) {
    const session = await this.findOne(sessionId);

    if (!session) {
      throw TelehealthException.sessionNotFound(sessionId);
    }

    // Check if user is the therapist
    const isTherapist = session.therapist_id.toString() === userId.toString();
    
    // Check if user is the client
    const isClient = session.client_id && session.client_id.toString() === userId.toString();
    
    // Check if user is a participant
    const isParticipant = session.virtual_session_participants.some(
      (p: any) => p.user_id.toString() === userId.toString()
    );

    if (!isTherapist && !isClient && !isParticipant) {
      throw TelehealthException.insufficientPermission(userId, 'join this session');
    }

    let joinUrl = session.meeting_url;
    
    if (isTherapist) {
      joinUrl = session.host_url || session.meeting_url;
    } else if (isParticipant) {
      const participant = session.virtual_session_participants.find(
        (p: any) => p.user_id.toString() === userId.toString()
      );
      if (participant && participant.join_url) {
        joinUrl = participant.join_url;
      }
    }
    return {
      session_id: session.id,
      title: session.title,
      therapist: session.users_virtual_sessions_therapist_idTousers,
      meeting_id: session.meeting_id,
      provider: session.telehealth_providers,
      join_url: joinUrl,
      access_code: session.access_code,
      status: session.status,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
    };
  }
}
