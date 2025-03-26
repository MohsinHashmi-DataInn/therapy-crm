'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, LoginRequest, LoginResponse } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * Authentication hook to manage user auth state and operations
 * Provides functions for login, logout, and token management
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  /**
   * Initialize authentication state from localStorage on component mount
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /**
   * Store authentication data in localStorage
   */
  const storeAuthData = useCallback((token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }, []);

  /**
   * Clear authentication data from localStorage
   */
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Log in a user with credentials
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      setLoading(true);
      try {
        const response = await api.post<LoginResponse>('/auth/login', credentials);
        const { accessToken, user } = response.data;
        
        storeAuthData(accessToken, user);
        
        toast({
          title: 'Success',
          description: 'Logged in successfully',
          variant: 'success',
        });
        
        router.push('/dashboard');
        return true;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Login failed';
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        return false;
      } finally {
        setLoading(false);
      }
    },
    [storeAuthData, toast, router]
  );

  /**
   * Register a new user account
   */
  const register = useCallback(
    async (userData: RegisterData) => {
      setLoading(true);
      try {
        const response = await api.post<{ user: User; accessToken: string }>('/auth/register', userData);
        const { accessToken, user } = response.data;
        
        storeAuthData(accessToken, user);
        
        toast({
          title: 'Success',
          description: 'Registration successful',
          variant: 'success',
        });
        
        router.push('/dashboard');
        return true;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Registration failed';
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        return false;
      } finally {
        setLoading(false);
      }
    },
    [storeAuthData, toast, router]
  );

  /**
   * Log out the current user
   */
  const logout = useCallback(() => {
    clearAuthData();
    toast({
      title: 'Success',
      description: 'Logged out successfully',
      variant: 'success',
    });
    router.push('/login');
  }, [clearAuthData, toast, router]);

  /**
   * Check if the user is authenticated
   */
  const isAuthenticated = useCallback(() => {
    return !!token && !!user;
  }, [token, user]);

  /**
   * Check if the user has specific role
   */
  const hasRole = useCallback(
    (role: string) => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  return {
    user,
    loading,
    token,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
  };
};
