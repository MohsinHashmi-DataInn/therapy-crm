import axios from 'axios';
import { User } from '../types';
import { API_ENDPOINTS, AUTH } from '../constants';

/**
 * Type for user profile update request
 */
export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  name?: string;
  profileImage?: string;
}

/**
 * Type for password change request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Create API client instance with auth token
 */
const createAuthClient = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH.TOKEN_KEY) : null;
  
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
};

/**
 * Get current user profile
 * @returns User profile data
 */
export const getCurrentUser = async (): Promise<User> => {
  const client = createAuthClient();
  const response = await client.get(`${API_ENDPOINTS.USERS}/me`);
  return response.data;
};

/**
 * Update user profile
 * @param userId User ID
 * @param data Profile data to update
 * @returns Updated user profile
 */
export const updateUserProfile = async (
  userId: string, 
  data: UpdateUserProfileRequest
): Promise<User> => {
  const client = createAuthClient();
  const response = await client.patch(`${API_ENDPOINTS.USERS}/${userId}`, data);
  return response.data;
};

/**
 * Change user password
 * @param data Password change data
 * @returns Success status
 */
export const changePassword = async (
  data: ChangePasswordRequest
): Promise<boolean> => {
  const client = createAuthClient();
  const response = await client.post(`${API_ENDPOINTS.USERS}/change-password`, data);
  return response.status === 200;
};
