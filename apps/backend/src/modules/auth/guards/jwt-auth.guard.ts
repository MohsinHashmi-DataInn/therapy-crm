import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard to protect routes that require authentication
 * Uses the JWT strategy to validate tokens
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Determines if the request is allowed to proceed
   * @param context - Current execution context
   * @returns Boolean indicating if request should proceed
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  /**
   * Handles unauthorized exceptions
   * @param err - Error that occurred during authentication
   */
  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw new UnauthorizedException('Authentication failed or token expired');
    }
    return user;
  }
}
