import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { createTypedPrismaClient } from '../../../common/prisma/prisma.types';

/**
 * Service for analytics related to telehealth sessions
 * Provides metrics and reporting capabilities for virtual sessions
 */
@Injectable()
export class TelehealthAnalyticsService {
  private readonly logger = new Logger(TelehealthAnalyticsService.name);
  private readonly typedPrisma;

  constructor(private readonly prisma: PrismaService) {
    this.typedPrisma = createTypedPrismaClient(this.prisma);
  }

  /**
   * Get analytics for all virtual sessions in a specified date range
   * 
   * @param startDate Start date for analytics period
   * @param endDate End date for analytics period
   * @returns Session analytics data
   */
  async getSessionAnalytics(startDate: Date, endDate: Date) {
    this.logger.log(`Generating session analytics from ${startDate} to ${endDate}`);
    
    // Get total sessions by status
    const sessionsByStatus = await this.typedPrisma.virtual_sessions.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get average session duration
    const sessionsWithDuration = await this.typedPrisma.virtual_sessions.findMany({
      where: {
        status: 'COMPLETED',
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        scheduled_start: true,
        scheduled_end: true,
        actual_start: true,
        actual_end: true,
      },
    });

    // Calculate average scheduled and actual durations
    const durations = sessionsWithDuration.map((session: any) => {
      const scheduledDuration = 
        session.scheduled_end.getTime() - session.scheduled_start.getTime();
      
      // Only calculate actual duration if both timestamps exist
      const actualDuration = 
        session.actual_end && session.actual_start
          ? session.actual_end.getTime() - session.actual_start.getTime()
          : null;
          
      return {
        scheduledDuration: scheduledDuration / (1000 * 60), // in minutes
        actualDuration: actualDuration ? actualDuration / (1000 * 60) : null,
      };
    });

    const avgScheduledDuration = 
      durations.reduce((acc: number, curr: { scheduledDuration: number; actualDuration: number | null }) => acc + curr.scheduledDuration, 0) / 
      (durations.length || 1);
    
    const actualDurationsWithValues = durations.filter((d: { scheduledDuration: number; actualDuration: number | null }) => d.actualDuration !== null);
    const avgActualDuration = 
      actualDurationsWithValues.reduce((acc: number, curr: { scheduledDuration: number; actualDuration: number | null }) => acc + (curr.actualDuration || 0), 0) / 
      (actualDurationsWithValues.length || 1);

    // Get participant data
    const participantData = await this.typedPrisma.virtual_session_participants.groupBy({
      by: ['session_id'],
      _count: {
        id: true,
      },
      where: {
        virtual_sessions: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    });

    // Calculate average participants per session
    const totalParticipants = participantData.reduce((acc: number, curr: any) => acc + curr._count.id, 0);
    const avgParticipantsPerSession = totalParticipants / (participantData.length || 1);

    // Get provider usage stats
    const providerStats = await this.typedPrisma.virtual_sessions.groupBy({
      by: ['provider_id'],
      _count: {
        id: true,
      },
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    }) as Array<{ provider_id: bigint; _count: { id: number } }>;

    // Fetch provider names
    const providerIds = providerStats.map(stat => stat.provider_id);
    const providers = await this.typedPrisma.telehealth_providers.findMany({
      where: {
        id: {
          in: providerIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Map provider names to stats
    const providerUsage = providerStats.map((stat: any) => {
      const provider = providers.find((p: any) => p.id === stat.provider_id);
      return {
        providerId: stat.provider_id,
        providerName: provider?.name || 'Unknown Provider',
        sessionCount: stat._count.id,
      };
    });

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      sessionCounts: {
        total: sessionsByStatus.reduce((acc: number, curr: any) => acc + curr._count.id, 0),
        byStatus: sessionsByStatus.reduce((acc: Record<string, number>, curr: any) => {
          acc[curr.status] = curr._count.id;
          return acc;
        }, {}),
      },
      durations: {
        averageScheduledDuration: Math.round(avgScheduledDuration),
        averageActualDuration: Math.round(avgActualDuration),
        unit: 'minutes',
      },
      participants: {
        total: totalParticipants,
        averagePerSession: Math.round(avgParticipantsPerSession * 10) / 10,
      },
      providers: providerUsage.sort((a: any, b: any) => b.sessionCount - a.sessionCount),
    };
  }

  /**
   * Get detailed metrics for a specific session
   * 
   * @param sessionId The ID of the session to analyze
   * @returns Detailed session metrics
   */
  async getSessionMetrics(sessionId: bigint) {
    const session = await this.typedPrisma.virtual_sessions.findUnique({
      where: { id: sessionId },
      include: {
        telehealth_providers: true,
        virtual_session_participants: {
          select: {
            id: true,
            user_id: true,
            role: true,
            join_time: true,
            leave_time: true,
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
        virtual_session_recordings: {
          select: {
            id: true,
            recording_url: true,
            recording_type: true,
            duration: true,
            created_at: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Calculate session duration
    const scheduledDuration = 
      session.scheduled_end.getTime() - session.scheduled_start.getTime();
    
    const actualDuration = 
      session.actual_end && session.actual_start
        ? session.actual_end.getTime() - session.actual_start.getTime()
        : null;

    // Calculate participant metrics
    const participantMetrics = session.virtual_session_participants.map((participant: any) => {
      const duration = 
        participant.leave_time && participant.join_time
          ? participant.leave_time.getTime() - participant.join_time.getTime()
          : null;
      
      return {
        participantId: participant.id,
        userId: participant.user_id,
        name: `${participant.users.first_name} ${participant.users.last_name}`,
        role: participant.role,
        present: !!participant.join_time,
        joinTime: participant.join_time,
        leaveTime: participant.leave_time,
        durationMinutes: duration ? Math.round(duration / (1000 * 60)) : null,
      };
    });

    // Get attendance rate
    const totalParticipants = participantMetrics.length;
    const attendedParticipants = participantMetrics.filter((p: any) => p.present).length;
    const attendanceRate = totalParticipants > 0 ? attendedParticipants / totalParticipants : 0;

    return {
      sessionId,
      title: session.title,
      provider: {
        id: session.provider_id,
        name: session.telehealth_providers?.name || 'Unknown Provider',
      },
      status: session.status,
      scheduling: {
        scheduledStart: session.scheduled_start,
        scheduledEnd: session.scheduled_end,
        scheduledDurationMinutes: Math.round(scheduledDuration / (1000 * 60)),
        actualStart: session.actual_start,
        actualEnd: session.actual_end,
        actualDurationMinutes: actualDuration ? Math.round(actualDuration / (1000 * 60)) : null,
        startedOnTime: session.actual_start 
          ? session.actual_start.getTime() <= session.scheduled_start.getTime() + (5 * 60 * 1000) // 5-minute grace period
          : false,
        isCompleted: session.status === 'COMPLETED',
      },
      participants: {
        total: totalParticipants,
        attended: attendedParticipants,
        attendanceRate: Math.round(attendanceRate * 100),
        details: participantMetrics,
      },
      recordings: session.virtual_session_recordings.map((recording: any) => ({
        recordingId: recording.id,
        url: recording.recording_url,
        type: recording.recording_type,
        durationMinutes: recording.duration ? Math.round(recording.duration / 60) : null,
        createdAt: recording.created_at,
      })),
    };
  }

  /**
   * Get provider performance metrics
   * 
   * @param providerId The ID of the telehealth provider
   * @param startDate Start of the analysis period
   * @param endDate End of the analysis period
   * @returns Provider performance metrics
   */
  async getProviderPerformance(providerId: bigint, startDate: Date, endDate: Date) {
    // Get all sessions for this provider
    const sessions = await this.typedPrisma.virtual_sessions.findMany({
      where: {
        provider_id: providerId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        scheduled_start: true,
        scheduled_end: true,
        actual_start: true,
        actual_end: true,
        meeting_url: true,
      },
    }) as Array<{
      id: bigint;
      status: string;
      scheduled_start: Date;
      scheduled_end: Date;
      actual_start: Date | null;
      actual_end: Date | null;
      meeting_url: string | null;
    }>;

    // Calculate success rate
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const cancelledSessions = sessions.filter((s) => s.status === 'CANCELLED').length;
    const successRate = totalSessions > 0 ? completedSessions / totalSessions * 100 : 0;
    const cancellationRate = totalSessions > 0 ? cancelledSessions / totalSessions * 100 : 0;

    // Calculate reliability metrics
    let onTimeStarts = 0;
    let totalDurationDifference = 0;
    let sessionsWithDuration = 0;

    sessions.forEach((session) => {
      // Check if session started on time (within 5 minutes)
      if (session.actual_start && session.scheduled_start) {
        const startDifference = session.actual_start.getTime() - session.scheduled_start.getTime();
        if (startDifference <= 5 * 60 * 1000) { // 5 minutes grace period
          onTimeStarts++;
        }
      }

      // Calculate duration difference
      if (session.actual_end && session.actual_start && session.scheduled_end && session.scheduled_start) {
        const scheduledDuration = session.scheduled_end.getTime() - session.scheduled_start.getTime();
        const actualDuration = session.actual_end.getTime() - session.actual_start.getTime();
        const durationDifference = Math.abs(actualDuration - scheduledDuration);
        
        totalDurationDifference += durationDifference;
        sessionsWithDuration++;
      }
    });

    const punctualityRate = totalSessions > 0 ? onTimeStarts / totalSessions * 100 : 0;
    const avgDurationDifference = sessionsWithDuration > 0 
      ? Math.round(totalDurationDifference / sessionsWithDuration / (1000 * 60)) 
      : 0;

    // Get the provider details
    const provider = await this.typedPrisma.telehealth_providers.findUnique({
      where: { id: providerId },
    });

    return {
      providerId,
      providerName: provider?.name || 'Unknown Provider',
      period: {
        start: startDate,
        end: endDate,
      },
      sessionsHosted: {
        total: totalSessions,
        completed: completedSessions,
        cancelled: cancelledSessions,
        inProgress: sessions.filter(s => s.status === 'IN_PROGRESS').length,
        scheduled: sessions.filter(s => s.status === 'SCHEDULED').length,
      },
      reliability: {
        successRate: Math.round(successRate),
        cancellationRate: Math.round(cancellationRate),
        punctualityRate: Math.round(punctualityRate),
        averageDurationDiscrepancyMinutes: avgDurationDifference,
      },
      timestamps: {
        firstSessionInPeriod: sessions.length > 0 
          ? sessions.sort((a, b) => a.scheduled_start.getTime() - b.scheduled_start.getTime())[0].scheduled_start
          : null,
        lastSessionInPeriod: sessions.length > 0
          ? sessions.sort((a, b) => b.scheduled_start.getTime() - a.scheduled_start.getTime())[0].scheduled_start
          : null,
      }
    };
  }

  /**
   * Get detailed session data for reporting purposes
   * @param startDate Start date for the query period
   * @param endDate End date for the query period
   * @param providerId Optional provider ID to filter results
   * @returns Array of session objects with detailed information
   */
  async getDetailedSessionsData(
    startDate: Date,
    endDate: Date,
    providerId?: bigint,
  ): Promise<any[]> {
    // Build the where clause
    const whereClause: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Add provider filter if specified
    if (providerId) {
      whereClause.provider_id = providerId;
    }

    // Query the database
    const sessions = await this.typedPrisma.virtual_sessions.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        scheduled_start: true,
        scheduled_end: true,
        actual_start: true,
        actual_end: true,
        provider_id: true,
        created_at: true,
        updated_at: true,
        client_id: true,
      },
      orderBy: {
        scheduled_start: 'asc',
      },
    });

    // Transform for reporting
    return sessions.map((session: any) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      status: session.status,
      scheduledStart: session.scheduled_start,
      scheduledEnd: session.scheduled_end,
      actualStart: session.actual_start,
      actualEnd: session.actual_end,
      providerId: session.provider_id,
      clientId: session.client_id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }));
  }
}
