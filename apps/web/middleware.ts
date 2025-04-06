import { NextRequest, NextResponse } from 'next/server';
import { AUTH, ROUTES } from '@/lib/constants';

/**
 * Middleware to protect routes requiring authentication
 * Checks for authentication token in cookies or headers
 * Redirects to login page if not authenticated
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH.TOKEN_KEY)?.value;
  
  // Path being accessed
  const path = request.nextUrl.pathname;
  
  // Check if this is a protected route (dashboard routes)
  const isDashboardRoute = path.startsWith('/dashboard');

  // Check if this is an auth route (login, register, etc.)
  const isAuthRoute = path.startsWith('/login') || 
                     path.startsWith('/register') || 
                     path.startsWith('/verify-email') || 
                     path.startsWith('/forgot-password') || 
                     path.startsWith('/reset-password');

  // Public routes that don't require authentication
  const isPublicRoute = path === '/' || path.startsWith('/api/') || path.startsWith('/_next');

  // If token exists but user is trying to access auth routes, redirect to dashboard
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  // If no token and trying to access protected routes, redirect to login
  if (!token && isDashboardRoute) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // For all other routes, continue
  return NextResponse.next();
}

/**
 * Matcher configuration for the middleware
 * Specifies which routes the middleware should be applied to
 */
export const config = {
  matcher: [
    // Apply middleware to all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
