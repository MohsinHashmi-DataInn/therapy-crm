import { API_ENDPOINTS, DEFAULT_HEADERS } from '../constants';

/**
 * Interface for login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for login response
 */
export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified?: boolean;
  };
}

/**
 * Interface for registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Interface for forgot password request payload
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Interface for reset password request payload
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Interface for verify email request payload
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * API call to log in a user
 * @param data - Login request data
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(API_ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to login');
  }

  return response.json();
}

/**
 * API call to register a new user
 * @param data - Registration request data
 */
export async function registerUser(data: RegisterRequest): Promise<LoginResponse> {
  const response = await fetch(API_ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to register');
  }

  return response.json();
}

/**
 * API call to request a password reset
 * @param data - Forgot password request data
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to process forgot password request');
  }

  return response.json();
}

/**
 * API call to reset a user's password
 * @param data - Reset password request data
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to reset password');
  }

  return response.json();
}

/**
 * API call to verify a user's email
 * @param data - Verify email request data
 */
export async function verifyEmail(data: VerifyEmailRequest): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_ENDPOINTS.VERIFY_EMAIL, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to verify email');
  }

  return response.json();
}

/**
 * API call to request a new verification email
 * @param email - User's email address
 */
export async function sendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_ENDPOINTS.SEND_VERIFICATION, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send verification email');
  }

  return response.json();
}

/**
 * API call to get the authenticated user's profile
 * @param token - JWT access token
 */
export async function getUserProfile(token: string): Promise<LoginResponse['user']> {
  const response = await fetch(`${API_ENDPOINTS.LOGIN}/profile`, {
    method: 'GET',
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get user profile');
  }

  return response.json();
}

/**
 * Interface for change password request payload
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * API call to change user password
 * @param data - Change password request data
 */
export async function changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to change password');
  }

  return response.json();
}
