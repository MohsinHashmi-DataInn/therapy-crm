"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { AUTH, ROUTES } from "@/lib/constants";
import { isAuthRoute, isPublicRoute, isProtectedRoute } from "@/lib/routes";
import { logAuth } from "@/lib/logger";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest
} from "@/types/auth";

// -------------------
// TYPES & INTERFACES
// -------------------
// Anti-redirect-loop constants
const MAX_REDIRECTS = 3;
const REDIRECT_TIMEOUT = 2000; // ms

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<LoginResponse | null>;
  logout: () => void;
  register: (userData: RegisterRequest) => Promise<RegisterResponse | null>;
  isAuthenticated: boolean;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  updateUser: (user: User) => void;
  sendVerificationEmail?: (email: string) => Promise<boolean>;
  verifyEmail?: (token: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  hasRole: (role: string) => boolean;
}

// -------------------
// CONTEXT SETUP
// -------------------
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper functions for auth
const hasTokenInStorage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH.TOKEN_KEY);
};

/**
 * Set authentication token in both localStorage and cookies
 * This ensures both client-side and server-side (middleware) can access it
 */
const setAuthToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  
  if (token) {
    // Store in localStorage for client-side access
    localStorage.setItem(AUTH.TOKEN_KEY, token);
    
    // Store in cookies for middleware/SSR access
    document.cookie = `${AUTH.TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    // Remove from both storage mechanisms
    localStorage.removeItem(AUTH.TOKEN_KEY);
    document.cookie = `${AUTH.TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
};

/**
 * Get the initial user from localStorage, if any
 */
function getInitialUserFromStorage(): User | null {
  if (typeof window === "undefined") return null;
  
  try {
    logAuth('Checking localStorage for initial user');
    const userJSON = localStorage.getItem(AUTH.USER_KEY);
    if (!userJSON) return null;
    
    const user = JSON.parse(userJSON);
    return user;
  } catch (error) {
    console.error("Error parsing user from localStorage", error);
    return null;
  }
}

/**
 * Clear user and token from localStorage
 */
function clearUserAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH.USER_KEY);
  localStorage.removeItem(AUTH.TOKEN_KEY);
}

/**
 * Get token from storage
 */
const getTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH.TOKEN_KEY);
};

// -------------------
// AUTH PROVIDER COMPONENT
// -------------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    logAuth('Mounting AuthProvider');
  }
  
  // State initialization - always start with null for SSR compatibility
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [redirectCount, setRedirectCount] = useState(0);
  const [lastRedirectTime, setLastRedirectTime] = useState(0);
  
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  // Helper to check if user is authenticated
  const isAuthenticated = !!user && hasTokenInStorage();
  
  // Helper to check if user has a specific role
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };
  
  /**
   * Safe redirect function with loop protection
   * Prevents infinite redirect loops by tracking redirect count and timing
   */
  const safeRedirect = (path: string): void => {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    
    // Reset count if last redirect was a while ago
    if (now - lastRedirectTime > REDIRECT_TIMEOUT) {
      setRedirectCount(0);
    }
    
    // Check for redirect loops
    if (redirectCount >= MAX_REDIRECTS) {
      console.error('[Auth] Too many redirects detected, stopping redirect chain');
      toast({
        title: "Navigation Error",
        description: "Too many redirects detected. Please try navigating manually.",
        variant: "destructive",
      });
      return;
    }
    
    // Track this redirect
    setRedirectCount(prev => prev + 1);
    setLastRedirectTime(now);
    
    // Execute the redirect
    console.log(`[Auth] Redirecting to: ${path}`);
    router.replace(path);
  };
  
  // Initialize auth state from localStorage
  useEffect(() => {
    if (initialized) return;
    
    try {
      const storedUser = getInitialUserFromStorage();
      if (storedUser) {
        setUser(storedUser);
        const storedToken = localStorage.getItem(AUTH.TOKEN_KEY);
        setToken(storedToken);
      }
    } catch (error) {
      console.error('[Auth] Error initializing auth state:', error);
      clearUserAuth();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);
  
  // Handle route protection
  useEffect(() => {
    if (!initialized || loading || !pathname) return;
    
    // Case 1: Protected route with no auth - redirect to login
    if (isProtectedRoute(pathname) && (!user || !hasTokenInStorage())) {
      console.log('[Auth] Protected route accessed without authentication - redirecting to login');
      safeRedirect(ROUTES.LOGIN);
      return;
    }
    
    // Case 2: Auth route with valid auth - redirect to dashboard
    if (isAuthRoute(pathname) && user && hasTokenInStorage()) {
      console.log('[Auth] Auth route accessed while authenticated - redirecting to dashboard');
      safeRedirect(ROUTES.DASHBOARD);
      return;
    }
  }, [user, pathname, loading, initialized]);
  
  // Helper to send email verification link
  const sendVerificationEmail = async (email: string): Promise<boolean> => {
    try {
      // API call would go here
      toast({
        title: "Verification email sent",
        description: "Please check your email for verification link",
      });
      return true;
    } catch (error) {
      console.error('Send verification email error:', error);
      toast({
        title: "Failed to send verification email",
        description: "Please try again later",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Helper to verify email with token
  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      // API call would go here
      toast({
        title: "Email verified",
        description: "Your email has been verified successfully",
      });
      return true;
    } catch (error) {
      console.error('Verify email error:', error);
      toast({
        title: "Verification failed",
        description: "Invalid or expired verification token",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Login function
  const login = async (email: string, password: string): Promise<LoginResponse | null> => {
    try {
      logAuth('Login attempt', { email });
      
      // Mock a successful login for development
      // Create mock response data with the structure expected by LoginResponse
      const mockUser: User = {
        id: '1', 
        email: email, 
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        role: UserRole.ADMIN,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store the user data in localStorage for persistence
      localStorage.setItem(AUTH.USER_KEY, JSON.stringify(mockUser));
      
      // Generate a mock token
      const mockToken = 'jwt-mock-token-12345';
      setAuthToken(mockToken);
      
      // Update the context state
      setUser(mockUser);
      setToken(mockToken);
      
      // Show success message
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Generate a mock success response
      const mockResponse: LoginResponse = {
        success: true,
        message: 'Login successful',
        user: mockUser,
        accessToken: mockToken
      };
      
      return mockResponse;
    } catch (error) {
      // Handle error
      console.error('Login error:', error);
      clearUserAuth();
      setUser(null);
      setToken(null);
      
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      
      return null;
    }
  };
  
  // Logout function
  const logout = () => {
    if (typeof window !== 'undefined') {
      // Clear auth data from storage
      setAuthToken(null);
      localStorage.removeItem(AUTH.USER_KEY);
      
      // Reset state
      setUser(null);
      setToken(null);
      
      // Show logout confirmation
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to login page
      safeRedirect(ROUTES.LOGIN);
    }
  };
  
  // Register function
  const register = async (userData: RegisterRequest): Promise<RegisterResponse | null> => {
    try {
      console.log('Registration attempt', { email: userData.email });
      
      // Create mock user
      const mockUser: User = {
        id: '2', 
        email: userData.email, 
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        role: UserRole.USER,
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store the user data in localStorage for persistence
      localStorage.setItem(AUTH.USER_KEY, JSON.stringify(mockUser));
      
      // Generate a mock token
      const mockToken = 'jwt-mock-token-register-12345';
      setAuthToken(mockToken);
      
      // Update the context state
      setUser(mockUser);
      setToken(mockToken);
      
      // Show success message
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      
      // Generate a mock success response
      const mockResponse: RegisterResponse = {
        success: true,
        message: 'Registration successful',
        user: mockUser,
        accessToken: mockToken
      };
      
      return mockResponse;
    } catch (error) {
      // Handle error
      console.error('Registration error:', error);
      clearUserAuth();
      setUser(null);
      setToken(null);
      
      toast({
        title: "Registration failed",
        description: "There was an error creating your account",
        variant: "destructive",
      });
      
      return null;
    }
  };
  
  // Forgot password function
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      // API call would go here
      
      toast({
        title: "Reset link sent",
        description: "If an account exists with this email, a reset link has been sent",
      });
      
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Request failed",
        description: "Unable to send reset link",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Reset password function
  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    try {
      // API call would go here
      
      toast({
        title: "Password reset",
        description: "Your password has been reset successfully",
      });
      
      router.push(ROUTES.LOGIN);
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Reset failed",
        description: "Invalid or expired reset token",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Update user function
  const updateUser = (updatedUser: User): void => {
    if (!user) return;
    
    // Update state
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem(AUTH.USER_KEY, JSON.stringify(updatedUser));
    
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  };
  
  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // API call would go here
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
      return true;
    } catch (error: any) {
      console.error('Change password error:', error);
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Auth context provider function, returns an object with auth state and methods
  const contextValue: AuthContextType = {
    user,
    token,
    loading,
    initialized,
    login,
    logout,
    register,
    isAuthenticated,
    forgotPassword,
    resetPassword,
    updateUser,
    changePassword,
    sendVerificationEmail,
    verifyEmail,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook is already defined at the top of the file
