import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

/**
 * Axios instance configured for API requests
 * Includes base URL and interceptors for handling common response patterns
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add auth tokens
 * Retrieves token from localStorage if available
 */
api.interceptors.request.use(
  (config) => {
    // Get token key from environment or use default
    const tokenKey = process.env.NEXT_PUBLIC_TOKEN_KEY || 'auth_token';
    const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Hook for using the API in components
 * Provides API instance and helper methods
 */
export const useApi = () => {
  const { toast } = useToast();

  /**
   * Generic error handler for API requests
   */
  const handleError = (error: any) => {
    console.error('API Error:', error);
    
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'An unexpected error occurred';
    
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
    
    return Promise.reject(error);
  };

  return {
    api,
    handleError,
  };
};

export default api;
