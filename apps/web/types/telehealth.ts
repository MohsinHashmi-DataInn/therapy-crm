/**
 * Types for telehealth functionality
 */

/**
 * Session status type
 */
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Telehealth session information
 */
export interface Session {
  id: string;
  title: string;
  description?: string;
  scheduledStart: string;  // ISO date string
  scheduledEnd: string;    // ISO date string
  status: SessionStatus;
  providerId: string;
  providerName?: string;
  therapistId: string;
  therapistName?: string;
  clientId?: string;
  meetingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Options for fetching sessions
 */
export interface SessionQueryOptions {
  status?: SessionStatus[];
  startDate?: string;
  endDate?: string;
  therapistId?: string;
  clientId?: string;
}

/**
 * Response from join session API
 */
export interface JoinSessionResponse {
  sessionId: string;
  joinUrl: string;
  token?: string;
}

/**
 * Participant information for a session
 */
export interface SessionParticipant {
  id: string;
  userId: string;
  name: string;
  role: string;
  joinTime?: string;
  leaveTime?: string;
}

/**
 * Session recording information
 */
export interface SessionRecording {
  id: string;
  recordingUrl: string;
  recordingType: string;
  duration?: number;
  createdAt: string;
}

/**
 * Analytics for telehealth sessions
 */
export interface TelehealthAnalytics {
  period: {
    start: string;
    end: string;
  };
  sessionCounts: {
    total: number;
    byStatus: Record<string, number>;
  };
  durations: {
    averageScheduledDuration: number;
    averageActualDuration: number;
    unit: string;
  };
  participants: {
    total: number;
    averagePerSession: number;
  };
  providers: Array<{
    providerId: string;
    providerName: string;
    sessionCount: number;
  }>;
}
