/**
 * Type definitions for API responses and data models
 * These types mirror the Prisma schema structure to ensure type safety
 */

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  STAFF = 'staff',
}

export enum ServiceType {
  INDIVIDUAL_THERAPY = 'individual_therapy',
  GROUP_THERAPY = 'group_therapy',
  FAMILY_THERAPY = 'family_therapy',
  COUPLE_THERAPY = 'couple_therapy',
  ASSESSMENT = 'assessment',
  CONSULTATION = 'consultation',
}

export enum WaitlistStatus {
  WAITING = 'waiting',
  CONTACTED = 'contacted',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
}

export enum CommunicationType {
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
  VIDEO = 'video',
  IN_PERSON = 'in_person',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  client?: Client;
  therapistId: string;
  therapist?: User;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  serviceType: ServiceType;
  createdAt: string;
  updatedAt: string;
}

export interface Waitlist {
  id: string;
  clientId: string;
  client?: Client;
  serviceType: ServiceType;
  status: WaitlistStatus;
  requestDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: string;
  clientId: string;
  client?: Client;
  userId: string;
  user?: User;
  type: CommunicationType;
  content: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API pagination response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Common API error response structure
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response structure
 */
export interface LoginResponse {
  accessToken: string;
  user: User;
}
