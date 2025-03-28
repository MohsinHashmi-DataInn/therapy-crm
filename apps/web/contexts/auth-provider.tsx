"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
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
  logout: () => {},
  isAuthenticated: () => false,
  hasRole: () => false,
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
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }

    setLoading(false);
  }, []);

  // Protected route handling
  useEffect(() => {
    if (!loading) {
      // Define public routes that should be accessible without authentication
      const publicRoutes = ['/', '/login', '/register', '/register2', '/register-new', '/public-register'];
      const isPublicRoute = publicRoutes.includes(pathname || '');
      
      // Auth routes are for authentication flows (login/register)
      const authRoutes = ['/login', '/register', '/register2', '/register-new', '/public-register'];
      const isAuthRoute = authRoutes.includes(pathname || '');
      
      // Protected routes require authentication
      const isProtectedRoute = !isPublicRoute;
      
      // Redirect unauthenticated users from protected routes to login
      if (isProtectedRoute && !user) {
        router.push("/login");
      }
      
      // Redirect authenticated users from auth routes to dashboard
      if (isAuthRoute && user) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  /**
   * Login function
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // This is a mock implementation - replace with real API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      const data = await response.json();
      const { accessToken, user } = data;
      
      // Store auth data
      localStorage.setItem("auth_token", accessToken);
      localStorage.setItem("auth_user", JSON.stringify(user));
      
      setUser(user);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
        variant: "success",
      });
      
      router.push("/dashboard");
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
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
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    
    toast({
      title: "Success",
      description: "Logged out successfully",
      variant: "success",
    });
    
    router.push("/login");
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

  const contextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
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
