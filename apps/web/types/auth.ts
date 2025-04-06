import { User } from "@/lib/types";

/**
 * Interface for login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for login response from API
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  user: User;
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
 * Interface for registration response from API
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  accessToken: string;
  user: User;
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
 * Interface for change password request payload
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Standard response format for auth-related API calls
 */
export interface AuthApiResponse {
  success: boolean;
  message: string;
  data?: any;
}
