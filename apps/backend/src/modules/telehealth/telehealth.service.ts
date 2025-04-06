import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CreateVirtualSessionDto } from './dto/create-virtual-session.dto';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

/**
 * Service for managing telehealth virtual sessions and integrations
 * with third-party providers like Zoom, Microsoft Teams, etc.
 */
@Injectable()
export class TelehealthService {
  private readonly logger = new Logger(TelehealthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Create a new virtual session for an appointment
   * @param createVirtualSessionDto - Session creation DTO
   * @param userId - ID of the user creating the session
   * @returns Created virtual session with meeting details
   */
  async createVirtualSession(
    createVirtualSessionDto: CreateVirtualSessionDto,
    userId: bigint,
  ) {
    // Check if appointment exists
    const appointment = await this.prismaService.appointments.findUnique({
      where: { id: BigInt(createVirtualSessionDto.appointmentId) },
      include: {
        clients: true,
        learners: true,
        users: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${createVirtualSessionDto.appointmentId} not found`,
      );
    }

    // Check if virtual session already exists for this appointment
    const existingSession = await this.prismaService.virtual_sessions.findFirst({
      where: { appointment_id: BigInt(createVirtualSessionDto.appointmentId) },
    });

    if (existingSession) {
      throw new BadRequestException(
        `A virtual session already exists for appointment ${createVirtualSessionDto.appointmentId}`,
      );
    }

    // Get provider information
    const provider = await this.prismaService.telehealth_providers.findUnique({
      where: { id: BigInt(createVirtualSessionDto.provider_id) },
    });

    if (!provider) {
      throw new NotFoundException(
        `Telehealth provider with ID ${createVirtualSessionDto.provider_id} not found`,
      );
    }

    if (!provider.is_active) {
      throw new BadRequestException(
        `Telehealth provider ${provider.name} is currently inactive`,
      );
    }

    // Generate meeting details using provider API
    const meetingDetails = await this.createMeetingWithProvider(
      provider,
      createVirtualSessionDto,
      appointment,
    );

    // Create virtual session record
    const virtualSession = await this.prismaService.virtual_sessions.create({
      data: {
        appointment_id: createVirtualSessionDto.appointmentId ? BigInt(createVirtualSessionDto.appointmentId) : null,
        provider_id: BigInt(createVirtualSessionDto.provider_id),
        meeting_id: meetingDetails.meetingId,
        join_url: meetingDetails.joinUrl,
        host_url: meetingDetails.hostUrl,
        password: meetingDetails.password,
        waiting_room_enabled: createVirtualSessionDto.waitingRoomEnabled ?? true,
        recording_enabled: createVirtualSessionDto.recordingEnabled ?? false,
        status: 'SCHEDULED',
        start_time: new Date(createVirtualSessionDto.scheduledStartTime),
        duration_minutes: createVirtualSessionDto.durationMinutes,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: userId,
        updated_by: userId,
        additional_settings: createVirtualSessionDto.providerSettings || {},
      },
    });

    // Update the appointment to mark it as virtual
    await this.prismaService.appointments.update({
      where: { id: BigInt(createVirtualSessionDto.appointmentId) },
      data: {
        is_virtual: true,
        virtual_session_id: virtualSession.id,
      },
    });

    // Add participants
    const participants = [];

    // Add therapist (appointment owner)
    if (appointment.users) {
      participants.push({
        virtual_session_id: virtualSession.id,
        user_id: appointment.users.id,
        email: appointment.users.email,
        display_name: `${appointment.users.first_name} ${appointment.users.last_name}`,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Add client/learner
    if (appointment.clients) {
      participants.push({
        virtual_session_id: virtualSession.id,
        client_id: appointment.clients.id,
        email: appointment.clients.email,
        display_name: `${appointment.clients.first_name} ${appointment.clients.last_name} (Client)`,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Add additional participants if provided
    if (createVirtualSessionDto.additionalParticipants?.length) {
      for (const email of createVirtualSessionDto.additionalParticipants) {
        participants.push({
          virtual_session_id: virtualSession.id,
          email: email,
          display_name: email.split('@')[0], // Basic display name from email
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    // Create participants in batch
    if (participants.length) {
      await this.prismaService.virtual_session_participants.createMany({
        data: participants,
      });
    }

    return {
      ...virtualSession,
      participants: await this.prismaService.virtual_session_participants.findMany({
        where: { virtual_session_id: virtualSession.id },
      }),
    };
  }

  /**
   * Get details of a virtual session by ID
   * @param id - Virtual session ID
   * @returns Virtual session details including meeting information
   */
  async getVirtualSessionById(id: number) {
    const virtualSessionId = BigInt(id);
    
    const virtualSession = await this.prismaService.virtual_sessions.findUnique({
      where: { id: virtualSessionId },
      include: {
        appointments: {
          include: {
            clients: true,
            learners: true,
            users: true,
          },
        },
        telehealth_providers: true,
      },
    });

    if (!virtualSession) {
      throw new NotFoundException(`Virtual session with ID ${id} not found`);
    }

    // Get participants
    const participants = await this.prismaService.virtual_session_participants.findMany({
      where: { virtual_session_id: virtualSessionId },
    });

    // Get recordings if any
    const recordings = await this.prismaService.virtual_session_recordings.findMany({
      where: { virtual_session_id: virtualSessionId },
    });

    return {
      ...virtualSession,
      participants,
      recordings,
    };
  }

  /**
   * List all virtual sessions with optional filtering
   * @param options - Filter options
   * @returns List of virtual sessions with pagination
   */
  async listVirtualSessions(options: {
    status?: string;
    providerId?: number;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (options.status) {
      where.status = options.status;
    }
    
    if (options.providerId) {
      where.provider_id = BigInt(options.providerId);
    }
    
    if (options.fromDate || options.toDate) {
      where.start_time = {};
      
      if (options.fromDate) {
        where.start_time.gte = new Date(options.fromDate);
      }
      
      if (options.toDate) {
        where.start_time.lte = new Date(options.toDate);
      }
    }
    
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    const virtualSessions = await this.prismaService.virtual_sessions.findMany({
      where,
      include: {
        appointments: true,
        telehealth_providers: true,
      },
      take: limit,
      skip: offset,
      orderBy: {
        start_time: 'desc',
      },
    });
    
    const total = await this.prismaService.virtual_sessions.count({ where });
    
    return {
      items: virtualSessions,
      total,
      limit,
      offset,
    };
  }

  /**
   * Update virtual session status
   * @param id - Virtual session ID
   * @param status - New status
   * @param userId - ID of the user making the update
   * @returns Updated virtual session
   */
  async updateSessionStatus(id: number, status: string, userId: bigint) {
    const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'];
    
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }
    
    const virtualSessionId = BigInt(id);
    
    const virtualSession = await this.prismaService.virtual_sessions.findUnique({
      where: { id: virtualSessionId },
    });
    
    if (!virtualSession) {
      throw new NotFoundException(`Virtual session with ID ${id} not found`);
    }
    
    // Update with additional data for certain statuses
    const updateData: any = {
      status,
      updated_at: new Date(),
      updated_by: userId,
    };
    
    if (status === 'IN_PROGRESS' && virtualSession.status === 'SCHEDULED') {
      updateData.start_time = new Date();
    }
    
    if (status === 'COMPLETED' && 
      (virtualSession.status === 'SCHEDULED' || virtualSession.status === 'IN_PROGRESS')) {
      updateData.end_time = new Date();
      
      // Calculate actual duration
      if (virtualSession.start_time) {
        const durationMs = updateData.end_time.getTime() - virtualSession.start_time.getTime();
        updateData.duration_minutes = Math.ceil(durationMs / (1000 * 60));
      }
    }
    
    return this.prismaService.virtual_sessions.update({
      where: { id: virtualSessionId },
      data: updateData,
    });
  }

  /**
   * Add a recording to a virtual session
   * @param sessionId - Virtual session ID
   * @param recordingData - Recording information
   * @param userId - ID of the user adding the recording
   * @returns Created recording record
   */
  async addSessionRecording(
    sessionId: number,
    recordingData: {
      recordingUrl: string;
      recordingType: string;
      startTime: string;
      endTime?: string;
      durationMinutes?: number;
      fileSizeBytes?: number;
    },
    userId: bigint,
  ) {
    const virtualSessionId = BigInt(sessionId);
    
    const virtualSession = await this.prismaService.virtual_sessions.findUnique({
      where: { id: virtualSessionId },
    });
    
    if (!virtualSession) {
      throw new NotFoundException(`Virtual session with ID ${sessionId} not found`);
    }
    
    // If recording has an end time and no duration, calculate it
    let durationMinutes = recordingData.durationMinutes;
    if (recordingData.endTime && !durationMinutes) {
      const startTime = new Date(recordingData.startTime);
      const endTime = new Date(recordingData.endTime);
      durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }
    
    // Create recording record
    const recording = await this.prismaService.virtual_session_recordings.create({
      data: {
        virtual_session_id: virtualSessionId,
        recording_url: recordingData.recordingUrl,
        recording_type: recordingData.recordingType,
        start_time: new Date(recordingData.startTime),
        end_time: recordingData.endTime ? new Date(recordingData.endTime) : null,
        duration_minutes: durationMinutes,
        file_size_bytes: recordingData.fileSizeBytes ? BigInt(recordingData.fileSizeBytes) : null,
        status: 'AVAILABLE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: userId,
        updated_by: userId,
      },
    });
    
    // If the virtual session's recording_url is not set, update it with this recording URL
    if (!virtualSession.recording_url) {
      await this.prismaService.virtual_sessions.update({
        where: { id: virtualSessionId },
        data: {
          recording_url: recordingData.recordingUrl,
          updated_at: new Date(),
          updated_by: userId,
        },
      });
    }
    
    return recording;
  }

  /**
   * Generate a join link for a participant
   * @param sessionId - Virtual session ID
   * @param participantEmail - Email of the participant
   * @returns Join URL for the participant
   */
  async generateParticipantJoinLink(sessionId: number, participantEmail: string) {
    const virtualSessionId = BigInt(sessionId);
    
    const virtualSession = await this.prismaService.virtual_sessions.findUnique({
      where: { id: virtualSessionId },
      include: {
        telehealth_providers: true,
      },
    });
    
    if (!virtualSession) {
      throw new NotFoundException(`Virtual session with ID ${sessionId} not found`);
    }
    
    // Check if the participant is registered
    const participant = await this.prismaService.virtual_session_participants.findFirst({
      where: {
        virtual_session_id: virtualSessionId,
        email: participantEmail,
      },
    });
    
    if (!participant) {
      // Register the participant if not found
      await this.prismaService.virtual_session_participants.create({
        data: {
          virtual_session_id: virtualSessionId,
          email: participantEmail,
          display_name: participantEmail.split('@')[0],
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
    
    // For simplicity, return the basic join URL for now
    // In a production system, you would customize this based on the provider
    // and potentially generate a unique token for secure access
    return {
      joinUrl: virtualSession.join_url,
      password: virtualSession.password,
      provider: virtualSession.telehealth_providers.name,
      meetingId: virtualSession.meeting_id,
      startTime: virtualSession.start_time,
      durationMinutes: virtualSession.duration_minutes,
    };
  }

  // Private methods for provider-specific integrations

  /**
   * Create a meeting with the specified provider
   * @param provider - Telehealth provider details
   * @param sessionDto - Session creation DTO
   * @param appointment - Associated appointment details
   * @returns Meeting details including URLs and IDs
   * @private
   */
  private async createMeetingWithProvider(
    provider: any,
    sessionDto: CreateVirtualSessionDto,
    appointment: any,
  ): Promise<{
    meetingId: string;
    joinUrl: string;
    hostUrl: string;
    password?: string;
  }> {
    try {
      // Based on provider name, call appropriate method
      switch (provider.name) {
        case 'Zoom':
          return this.createZoomMeeting(provider, sessionDto, appointment);
        case 'Microsoft Teams':
          return this.createTeamsMeeting(provider, sessionDto, appointment);
        case 'Doxy.me':
          return this.createDoxyMeSession(provider, sessionDto, appointment);
        default:
          // For demo purposes, generate a mock meeting if no integration available
          return this.createMockMeeting(provider, sessionDto, appointment);
      }
    } catch (error) {
      this.logger.error(`Failed to create meeting with provider ${provider.name}:`, error);
      throw new BadRequestException(
        `Failed to create meeting with provider ${provider.name}: ${error.message}`,
      );
    }
  }

  /**
   * Create a meeting with Zoom
   * @param provider - Zoom provider details
   * @param sessionDto - Session creation DTO
   * @param appointment - Associated appointment
   * @returns Zoom meeting details
   * @private
   */
  private async createZoomMeeting(
    provider: any,
    sessionDto: CreateVirtualSessionDto,
    appointment: any,
  ) {
    // API key and secret should be securely managed via environment variables or a key vault
    const apiKey = this.configService.get<string>('ZOOM_API_KEY');
    const apiSecret = this.configService.get<string>('ZOOM_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      throw new BadRequestException('Zoom API credentials not configured');
    }
    
    // In an actual implementation, you would:
    // 1. Generate a JWT token for Zoom API authentication
    // 2. Call the Zoom API to create a meeting
    // 3. Parse the response and return the necessary details
    
    // Mock implementation for demonstration
    const meetingPassword = crypto.randomBytes(5).toString('hex');
    const meetingId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    return {
      meetingId: meetingId,
      joinUrl: `https://zoom.us/j/${meetingId}?pwd=${meetingPassword}`,
      hostUrl: `https://zoom.us/s/${meetingId}?zak=host-token-here`,
      password: meetingPassword,
    };
  }

  /**
   * Create a meeting with Microsoft Teams
   * @param provider - Teams provider details
   * @param sessionDto - Session creation DTO
   * @param appointment - Associated appointment
   * @returns Teams meeting details
   * @private
   */
  private async createTeamsMeeting(
    provider: any,
    sessionDto: CreateVirtualSessionDto,
    appointment: any,
  ) {
    // Microsoft Graph API integration would go here
    // Would require Azure AD authentication and Microsoft Graph API calls
    
    // Mock implementation for demonstration
    const meetingId = crypto.randomBytes(10).toString('hex');
    
    return {
      meetingId: meetingId,
      joinUrl: `https://teams.microsoft.com/l/meetup-join/${meetingId}`,
      hostUrl: `https://teams.microsoft.com/l/meetup-join/${meetingId}?host=true`,
    };
  }

  /**
   * Create a session with Doxy.me
   * @param provider - Doxy.me provider details
   * @param sessionDto - Session creation DTO
   * @param appointment - Associated appointment
   * @returns Doxy.me session details
   * @private
   */
  private async createDoxyMeSession(
    provider: any,
    sessionDto: CreateVirtualSessionDto,
    appointment: any,
  ) {
    // Doxy.me API integration would go here
    
    // Mock implementation for demonstration
    const therapistName = appointment.users 
      ? `${appointment.users.first_name.toLowerCase()}-${appointment.users.last_name.toLowerCase()}`
      : 'therapist';
    
    return {
      meetingId: `doxy-${Date.now()}`,
      joinUrl: `https://doxy.me/${therapistName}`,
      hostUrl: `https://provider.doxy.me/signin`,
    };
  }

  /**
   * Create a mock meeting for demonstration or testing
   * @param provider - Provider details
   * @param sessionDto - Session creation DTO
   * @param appointment - Associated appointment
   * @returns Mock meeting details
   * @private
   */
  private createMockMeeting(
    provider: any,
    sessionDto: CreateVirtualSessionDto,
    appointment: any,
  ) {
    const meetingId = `mock-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const password = crypto.randomBytes(4).toString('hex');
    
    return {
      meetingId: meetingId,
      joinUrl: `https://example.com/join/${meetingId}?pwd=${password}`,
      hostUrl: `https://example.com/host/${meetingId}?token=host-token`,
      password: password,
    };
  }
}
