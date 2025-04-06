import { NextRequest, NextResponse } from 'next/server';
import { AUTH } from '@/lib/constants';
import { ROUTES, isAuthRoute, isProtectedRoute, isPublicRoute } from '@/lib/routes';

/**
 * Middleware to protect routes requiring authentication
 * Checks for authentication token in cookies or headers
 * Redirects to login page if not authenticated
 */
export async function middleware(request: NextRequest) {
  // Check for token in both cookies and authorization header
  const cookieToken = request.cookies.get(AUTH.TOKEN_KEY)?.value;
  const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  const token = cookieToken || headerToken;
  
  // Path being accessed
  const path = request.nextUrl.pathname;
  
  // Log (for debugging only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Path: ${path}, Token: ${token ? 'exists' : 'missing'}`);
  }

  // If token exists but user is trying to access auth routes, redirect to dashboard
  if (token && isAuthRoute(path)) {
    console.log('[Middleware] Authenticated user accessing auth route - redirecting to dashboard');
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  // If no token and trying to access protected routes, redirect to login
  if (!token && isProtectedRoute(path)) {
    console.log('[Middleware] Unauthenticated user accessing protected route - redirecting to login');
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
