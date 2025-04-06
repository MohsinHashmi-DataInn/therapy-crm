import { Session, SessionQueryOptions, JoinSessionResponse, TelehealthAnalytics } from '@/types/telehealth';
import { apiClient } from '../api-client';

/**
 * Fetch telehealth sessions based on query options
 * 
 * @param options Query parameters for filtering sessions
 * @returns Array of session objects
 */
export async function fetchSessions(options?: SessionQueryOptions): Promise<Session[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (options?.status && options.status.length > 0) {
      options.status.forEach(status => {
        queryParams.append('status', status);
      });
    }
    
    if (options?.startDate) queryParams.append('startDate', options.startDate);
    if (options?.endDate) queryParams.append('endDate', options.endDate);
    if (options?.therapistId) queryParams.append('therapistId', options.therapistId);
    if (options?.clientId) queryParams.append('clientId', options.clientId);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await apiClient.get(`/api/telehealth/sessions${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching telehealth sessions:', error);
    throw error;
  }
}

/**
 * Fetch a single telehealth session by ID
 * 
 * @param sessionId ID of the session to fetch
 * @returns Session object
 */
export async function fetchSessionById(sessionId: string): Promise<Session> {
  try {
    const response = await apiClient.get(`/api/telehealth/sessions/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching telehealth session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Join a telehealth session
 * 
 * @param sessionId ID of the session to join
 * @returns Join session response with URL to join
 */
export async function joinSession(sessionId: string): Promise<JoinSessionResponse> {
  try {
    const response = await apiClient.post(`/api/telehealth/sessions/${sessionId}/join`, {});
    
    if (!response.ok) {
      throw new Error('Failed to join session');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error joining telehealth session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Get analytics for telehealth sessions
 * 
 * @param startDate Start date for analytics period (ISO string)
 * @param endDate End date for analytics period (ISO string)
 * @returns Telehealth analytics data
 */
export async function fetchTelehealthAnalytics(startDate: string, endDate: string): Promise<TelehealthAnalytics> {
  try {
    const queryParams = new URLSearchParams({
      startDate,
      endDate
    });
    
    const response = await apiClient.get(`/api/telehealth/analytics?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch telehealth analytics');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching telehealth analytics:', error);
    throw error;
  }
}

/**
 * Get detailed metrics for a specific session
 * 
 * @param sessionId ID of the session to analyze
 * @returns Session metrics data
 */
export async function fetchSessionMetrics(sessionId: string): Promise<any> {
  try {
    const response = await apiClient.get(`/api/telehealth/analytics/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch session metrics');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching metrics for session ${sessionId}:`, error);
    throw error;
  }
}
