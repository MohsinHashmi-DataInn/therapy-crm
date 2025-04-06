'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { AUTH, ROUTES } from '@/lib/constants';
import * as authApi from '@/lib/api/auth';
import type { LoginRequest, LoginResponse } from '@/lib/api/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified?: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
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
    const storedToken = localStorage.getItem(AUTH.TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH.USER_KEY);

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
    localStorage.setItem(AUTH.TOKEN_KEY, token);
    localStorage.setItem(AUTH.USER_KEY, JSON.stringify(user));
    setToken(token);
    setUser(user);
  }, []);

  /**
   * Clear authentication data from localStorage
   */
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(AUTH.TOKEN_KEY);
    localStorage.removeItem(AUTH.USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Log in a user with credentials
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      setLoading(true);
      console.log('[DEBUG] Login attempt with credentials:', { 
        email: credentials.email, 
        passwordLength: credentials.password?.length || 0 
      });
      try {
        console.log('[DEBUG] Sending login request to API...');
        const response = await authApi.loginUser(credentials);
        console.log('[DEBUG] Login response received:', { 
          hasAccessToken: !!response.accessToken,
          hasUserData: !!response.user,
        });
        
        const { accessToken, user } = response;
        
        // Check if email is verified
        if (user.isEmailVerified === false) {
          toast({
            title: 'Email Verification Required',
            description: 'Please verify your email address to access all features',
            variant: 'default',
          });
        }
        
        console.log('[DEBUG] Storing auth data in localStorage...');
        storeAuthData(accessToken, user);
        
        toast({
          title: 'Success',
          description: 'Logged in successfully',
          variant: 'default',
        });
        
        // Use window.location for a full page navigation instead of Next.js router
        // This ensures a complete page reload and proper auth context initialization
        console.log('[DEBUG] Redirecting to dashboard...');
        window.location.href = ROUTES.DASHBOARD;
        return true;
      } catch (error: any) {
        console.error('[DEBUG] Login error:', error);
        
        const errorMessage = error.message || 'Login failed';
        console.log('[DEBUG] Error message to display:', errorMessage);
        
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
    [storeAuthData, toast]
  );

  /**
   * Register a new user account
   */
  const register = useCallback(
    async (userData: RegisterData) => {
      setLoading(true);
      try {
        const response = await authApi.registerUser(userData);
        const { accessToken, user } = response;
        
        storeAuthData(accessToken, user);
        
        toast({
          title: 'Success',
          description: 'Registration successful. Please check your email to verify your account.',
          variant: 'default',
        });
        
        // Redirect to dashboard
        window.location.href = ROUTES.DASHBOARD;
        return true;
      } catch (error: any) {
        const errorMessage = error.message || 'Registration failed';
        
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
    [storeAuthData, toast]
  );

  /**
   * Log out the current user
   */
  const logout = useCallback(() => {
    clearAuthData();
    toast({
      title: 'Success',
      description: 'Logged out successfully',
      variant: 'default',
    });
    // Use window.location for a full page navigation instead of Next.js router
    // This ensures a complete page reload and proper auth context reset
    window.location.href = ROUTES.LOGIN;
  }, [clearAuthData, toast]);

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

  /**
   * Send a verification email to the user
   */
  const sendVerificationEmail = useCallback(
    async (email: string) => {
      setLoading(true);
      try {
        await authApi.sendVerificationEmail(email);
        
        toast({
          title: 'Success',
          description: 'Verification email sent successfully. Please check your inbox.',
          variant: 'default',
        });
        
        return true;
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to send verification email';
        
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
    [toast]
  );

  /**
   * Request a password reset for the given email
   */
  const forgotPassword = useCallback(
    async (email: string) => {
      setLoading(true);
      try {
        await authApi.forgotPassword({ email });
        
        toast({
          title: 'Success',
          description: 'Password reset instructions sent to your email',
          variant: 'default',
        });
        
        return true;
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to process password reset request';
        
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
    [toast]
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
    sendVerificationEmail,
    forgotPassword,
  };
};
