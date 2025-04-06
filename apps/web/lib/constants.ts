/**
 * API base URL for backend requests
 * In production, ensure this is set to the correct URL in environment variables
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Frontend base URL for generating links
 */
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

/**
 * Default headers for API requests
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Authentication-related constants
 */
export const AUTH = {
  TOKEN_KEY: 'auth_token',
  USER_KEY: 'auth_user',
  EXPIRY_KEY: 'auth_expiry',
  EXPIRES_KEY: 'auth_expires', // Keep both versions for backward compatibility
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  VERIFY_EMAIL: `${API_URL}/auth/verify-email`,
  SEND_VERIFICATION: `${API_URL}/auth/send-verification-email`,
  FORGOT_PASSWORD: `${API_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_URL}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_URL}/auth/change-password`,
  USERS: `${API_URL}/users`,
};

/**
 * Application Routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  SETTINGS: '/dashboard/settings',
  PROFILE: '/dashboard/profile',
  CLIENTS: '/dashboard/clients',
  NEW_CLIENT: '/dashboard/clients/new',
  CLIENT_DETAILS: (id: string) => `/dashboard/clients/${id}`,
  EDIT_CLIENT: (id: string) => `/dashboard/clients/${id}/edit`,
  
  APPOINTMENTS: '/dashboard/appointments',
  NEW_APPOINTMENT: '/dashboard/appointments/new',
  APPOINTMENT_DETAILS: (id: string) => `/dashboard/appointments/${id}`,
  EDIT_APPOINTMENT: (id: string) => `/dashboard/appointments/${id}/edit`,
  
  WAITLIST: '/dashboard/waitlist',
  ADD_WAITLIST: '/dashboard/waitlist/add',
  WAITLIST_DETAILS: (id: string) => `/dashboard/waitlist/${id}`,
  EDIT_WAITLIST: (id: string) => `/dashboard/waitlist/${id}/edit`,

  TELEHEALTH: '/dashboard/telehealth',
  TELEHEALTH_SESSION: (id: string) => `/dashboard/telehealth/sessions/${id}`,

  COMMUNICATIONS: '/dashboard/communications',
};
