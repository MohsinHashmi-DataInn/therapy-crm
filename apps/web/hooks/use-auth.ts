'use client';

// This file is a wrapper around the AuthProvider context
// It exists for backward compatibility with components that still use the useAuth hook
// All authentication logic should be centralized in contexts/auth-provider.tsx

import { useAuth as useAuthFromContext } from '@/contexts/auth-provider';
import type { LoginRequest, LoginResponse } from '@/lib/api/auth';

// Re-export types for backward compatibility
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  isVerified?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Custom hook for authentication operations
 * This is now just a wrapper around the AuthProvider context
 * for backward compatibility
 */
export const useAuth = () => {
  // Simply return the context
  return useAuthFromContext();
};
