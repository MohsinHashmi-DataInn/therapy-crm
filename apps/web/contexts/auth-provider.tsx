"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/lib/types";
import type { LoginResponse } from "@/lib/api/auth";
import { useToast } from "@/components/ui/use-toast";
import * as authApi from "@/lib/api/auth";
import { AUTH, ROUTES } from "@/lib/constants";

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: authApi.LoginRequest) => Promise<boolean>;
  register: (data: authApi.RegisterRequest) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  sendVerificationEmail: (email: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (data: authApi.ResetPasswordRequest) => Promise<boolean>;
  updateUser: (user: User) => void;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<boolean>;
}

/**
 * AuthProvider props interface
 */
interface AuthProviderProps {
  children: ReactNode;
}

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  isAuthenticated: () => false,
  hasRole: () => false,
  sendVerificationEmail: async () => false,
  verifyEmail: async () => false,
  forgotPassword: async () => false,
  resetPassword: async () => false,
  updateUser: () => {},
  changePassword: async () => false,
});

/**
 * Authentication Provider component
 * Manages global auth state and provides auth methods to all children
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Authenticate user on initial load
  useEffect(() => {
    // Check for existing auth token and user data
    const storedToken = localStorage.getItem(AUTH.TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH.USER_KEY);

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        
        // Optional: Validate token by calling an API endpoint
        // This could be done if you want to ensure the token is still valid
        // and hasn't expired on the server side
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem(AUTH.TOKEN_KEY);
        localStorage.removeItem(AUTH.USER_KEY);
      }
    }

    setLoading(false);
  }, []);

  // Protected route handling
  useEffect(() => {
    if (!loading) {
      // Define public routes that should be accessible without authentication
      const publicRoutes = [
        ROUTES.HOME, 
        ROUTES.LOGIN, 
        ROUTES.REGISTER, 
        ROUTES.FORGOT_PASSWORD,
        ROUTES.RESET_PASSWORD,
        ROUTES.VERIFY_EMAIL
      ];
      const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
      
      // Auth routes are for authentication flows (login/register)
      const authRoutes = [
        ROUTES.LOGIN,
        ROUTES.REGISTER
      ];
      const isAuthRoute = authRoutes.some(route => pathname?.startsWith(route));
      
      // Protected routes require authentication
      const isProtectedRoute = !isPublicRoute;
      
      // Redirect unauthenticated users from protected routes to login
      if (isProtectedRoute && !user) {
        router.push(ROUTES.LOGIN);
      }
      
      // Redirect authenticated users from auth routes to dashboard
      if (isAuthRoute && user) {
        router.push(ROUTES.DASHBOARD);
      }
    }
  }, [user, loading, pathname, router]);

  /**
   * Login function
   */
  const login = async (credentials: authApi.LoginRequest): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await authApi.loginUser(credentials);
      const { accessToken, user: apiUser } = response;
      
      // Check if email verification is required
      if (apiUser.isEmailVerified === false) {
        toast({
          title: "Email Verification Required",
          description: "Please verify your email address to access all features",
        });
      }
      
      // Convert API user to application User type
      const appUser: User = {
        id: apiUser.id,
        email: apiUser.email,
        name: `${apiUser.firstName} ${apiUser.lastName}`,
        role: apiUser.role as any, // Convert string to enum
        createdAt: new Date().toISOString(), // Default value if not provided by API
        updatedAt: new Date().toISOString()  // Default value if not provided by API
      };
      
      // Store auth data
      localStorage.setItem(AUTH.TOKEN_KEY, accessToken);
      localStorage.setItem(AUTH.USER_KEY, JSON.stringify(appUser));
      
      setUser(appUser);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      router.push(ROUTES.DASHBOARD);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Login failed";
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register function
   */
  const register = async (data: authApi.RegisterRequest): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await authApi.registerUser(data);
      const { accessToken, user: apiUser } = response;
      
      // Convert API user to application User type
      const appUser: User = {
        id: apiUser.id,
        email: apiUser.email,
        name: `${apiUser.firstName} ${apiUser.lastName}`,
        role: apiUser.role as any, // Convert string to enum
        createdAt: new Date().toISOString(), // Default value if not provided by API
        updatedAt: new Date().toISOString()  // Default value if not provided by API
      };
      
      // Store auth data
      localStorage.setItem(AUTH.TOKEN_KEY, accessToken);
      localStorage.setItem(AUTH.USER_KEY, JSON.stringify(appUser));
      
      setUser(appUser);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please check your email for verification instructions.",
      });
      
      router.push(ROUTES.DASHBOARD);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Registration failed";
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    localStorage.removeItem(AUTH.TOKEN_KEY);
    localStorage.removeItem(AUTH.USER_KEY);
    setUser(null);
    
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
    
    router.push(ROUTES.LOGIN);
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return !!user;
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role: string) => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * Send verification email
   */
  const sendVerificationEmail = async (email: string): Promise<boolean> => {
    try {
      const result = await authApi.sendVerificationEmail(email);
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for verification instructions",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Verify email with token
   */
  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      const result = await authApi.verifyEmail({ token });
      
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified",
      });
      
      // If user is logged in, update the verification status
      if (user) {
        // Note: we don't actually update isEmailVerified in our User type
        // since it's not part of the type, but we keep it in localStorage
        // to maintain this information across sessions
        const userData = JSON.parse(localStorage.getItem(AUTH.USER_KEY) || '{}');
        const updatedUserData = { ...userData, isEmailVerified: true };
        localStorage.setItem(AUTH.USER_KEY, JSON.stringify(updatedUserData));
      }
      
      return true;
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify email",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Request password reset
   */
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const result = await authApi.forgotPassword({ email });
      
      toast({
        title: "Reset Instructions Sent",
        description: "Please check your email for password reset instructions",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send reset instructions",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (data: authApi.ResetPasswordRequest): Promise<boolean> => {
    try {
      const result = await authApi.resetPassword(data);
      
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Update user information
   */
  const updateUser = (updatedUser: User) => {
    // Update user in state
    setUser(updatedUser);
    
    // Update user in local storage
    localStorage.setItem(AUTH.USER_KEY, JSON.stringify(updatedUser));
  };

  /**
   * Change user password
   */
  const changePassword = async (
    data: { currentPassword: string; newPassword: string }
  ): Promise<boolean> => {
    try {
      // Call API to change password
      const result = await authApi.changePassword(data);
      
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
      return false;
    }
  };

  const contextValue = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    sendVerificationEmail,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateUser,
    changePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use auth context
 */
export const useAuth = () => useContext(AuthContext);
