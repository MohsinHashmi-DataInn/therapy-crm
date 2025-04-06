/**
 * Centralized route configuration
 * This file contains all route definitions and helper functions for route categorization
 */

// Main application routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  CLIENTS: '/clients',
  APPOINTMENTS: '/appointments',
  BILLING: '/billing',
  TELEHEALTH: '/telehealth',
  TASKS: '/tasks',
  NOTES: '/notes',
  REPORTS: '/reports',
  HELP: '/help',
  ABOUT: '/about',
  BLOG: '/blog',
};

// Define all auth routes (login, register, etc.)
export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.VERIFY_EMAIL,
];

// Define all dashboard/protected routes
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PROFILE,
  ROUTES.SETTINGS,
  ROUTES.CLIENTS, 
  ROUTES.APPOINTMENTS,
  ROUTES.BILLING,
  ROUTES.TELEHEALTH,
  ROUTES.TASKS,
  ROUTES.NOTES,
  ROUTES.REPORTS,
];

// Define all public/content routes (no auth required)
export const PUBLIC_CONTENT_ROUTES = [
  ROUTES.HOME,
  ROUTES.HELP,
  ROUTES.ABOUT,
  ROUTES.BLOG,
];

// Special system paths that should always be accessible
export const SYSTEM_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/images',
  '/assets',
];

/**
 * Check if a path is an authentication route
 * @param path Path to check
 * @returns Boolean indicating if path is an auth route
 */
export function isAuthRoute(path: string): boolean {
  if (!path) return false;
  
  return AUTH_ROUTES.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
}

/**
 * Check if a path is a protected route requiring authentication
 * @param path Path to check
 * @returns Boolean indicating if path is a protected route
 */
export function isProtectedRoute(path: string): boolean {
  if (!path) return false;
  
  // Check if path starts with any protected route prefix
  return PROTECTED_ROUTES.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
}

/**
 * Check if a path is a public route (no auth required)
 * @param path Path to check
 * @returns Boolean indicating if path is a public route
 */
export function isPublicRoute(path: string): boolean {
  if (!path) return true; // Default to public during initial load
  
  // If it's an auth route, it's public (accessible without auth)
  if (isAuthRoute(path)) return true;
  
  // Check if it's a public content route
  const isPublicContent = PUBLIC_CONTENT_ROUTES.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
  if (isPublicContent) return true;
  
  // Check if it's a system path
  const isSystemPath = SYSTEM_PATHS.some(prefix => 
    path.startsWith(prefix)
  );
  
  return isSystemPath;
}
