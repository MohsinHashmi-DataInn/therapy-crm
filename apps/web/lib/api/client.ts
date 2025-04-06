import axios from 'axios';
import { AUTH } from '../constants';

/**
 * Axios client instance for API requests
 * Automatically includes authorization header if token exists
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if exists
    const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH.TOKEN_KEY) : null;
    
    // If token exists, add to headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Redirect to login or refresh token logic could go here
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH.TOKEN_KEY);
        localStorage.removeItem(AUTH.USER_KEY);
        window.location.href = '/login';
      }
    }
    
    // Extract error message from response if available
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      'An unknown error occurred';
    
    const enhancedError = new Error(errorMessage);
    return Promise.reject(enhancedError);
  }
);
