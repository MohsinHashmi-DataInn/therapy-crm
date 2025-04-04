import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Simplified Mock JWT Auth Guard for testing purposes
 * This guard always allows access and sets a consistent mock user on the request
 */
@Injectable()
export class MockJwtAuthGuard {
  /**
   * Always returns true to allow all requests during testing
   * and sets a mock user on the request
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // If no authorization header exists, reject the request
    if (!request.headers.authorization) {
      console.log('MockJwtAuthGuard - No authorization header found');
      throw new UnauthorizedException('No authorization token provided');
    }
    
    // Check for Bearer token format
    if (!request.headers.authorization.startsWith('Bearer ')) {
      console.log('MockJwtAuthGuard - Invalid token format');
      throw new UnauthorizedException('Invalid token format');
    }
    
    // Extract token
    const token = request.headers.authorization.split(' ')[1];
    
    // For testing purposes, use a very simple token validation
    // In this case, we'll consider 'invalid-token' as invalid
    if (token === 'invalid-token' || !token) {
      console.log('MockJwtAuthGuard - Invalid token detected:', token);
      throw new UnauthorizedException('Invalid or expired token');
    }
    
    console.log('MockJwtAuthGuard - Valid token found:', token);
    
    // Get user ID from the token or header
    let userId = '999'; // Default ID for mock user
    let userEmail = 'mock-999@example.com';
    let userRole = 'STAFF';
    
    // Extract the payload from the token if possible to get the role
    try {

      // Check if we have test headers for token type
      if (request.headers['x-test-token-type'] === 'admin') {
        userId = '1';
        userRole = 'ADMIN';
      } else if (request.headers['x-test-token-type'] === 'staff') {
        userId = '2';
        userRole = 'STAFF';
      }
      
      // If there's a specific user ID header, use that instead (highest priority)
      if (request.headers['x-user-id']) {
        userId = request.headers['x-user-id'] as string;
        console.log('MockJwtAuthGuard - Using X-User-ID from header:', userId);
      }

      // If there's a specific expected email header, use that
      if (request.headers['x-expected-email']) {
        userEmail = request.headers['x-expected-email'] as string;
        console.log('MockJwtAuthGuard - Using X-Expected-Email from header:', userEmail);
      }
      // If headers don't have a specific token type but we detect admin in the token
      else if (token.includes('admin') || request.headers['x-test-admin'] === 'true') {
        userId = '1';
        userEmail = 'admin@example.com';
        userRole = 'ADMIN';
        console.log('MockJwtAuthGuard - Detected admin token or admin test header');
      } 
      else if (token.includes('staff')) {
        userId = '2';
        userEmail = 'staff@example.com';
        userRole = 'STAFF';
        console.log('MockJwtAuthGuard - Detected staff token');
      }
      // Default case for any unidentified token in tests
      else {
        // In tests where the token type isn't specified in headers or the token,
        // check if an admin token was generated for login
        if (token.length > 20) {
          // For real logins with longer tokens, default to admin to facilitate testing
          userId = '1';
          userEmail = 'admin@example.com';
          userRole = 'ADMIN';
          console.log('MockJwtAuthGuard - Login token detected, defaulting to admin role for tests');
        } else {
          console.log('MockJwtAuthGuard - Using default role: STAFF');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.log('MockJwtAuthGuard - Error parsing token:', errorMessage);
      // Fall back to admin for tests
      userId = '1';
      userEmail = 'admin@example.com';
      userRole = 'ADMIN';
    }
    
    // Create a mock user with ID as string to avoid conversion issues
    const mockUser = {
      // Store both formats to ensure compatibility
      id: userId,
      // Maintain the numeric ID as well for services that might expect it
      _id: BigInt(userId),
      email: userEmail,
      role: userRole,
      firstName: 'Test',
      lastName: 'User',
      // Add a toString method to ensure BigInt serialization works if needed
      toString: function() { return userId; }
    };
    
    // Set the user on the request
    request.user = mockUser;
    console.log('MockJwtAuthGuard - Set mock user on request:', {
      id: mockUser.id.toString(),
      email: mockUser.email,
      role: mockUser.role
    });
    
    return true;
  }
}
