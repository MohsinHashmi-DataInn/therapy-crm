import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
}

/**
 * JWT authentication strategy
 * Validates JWT tokens and attaches user to request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate the JWT payload and return the user
   * @param payload - JWT payload containing user information
   * @returns User object to attach to request
   */
  async validate(payload: JwtPayload) {
    try {
      // Get the user ID from the payload
      const userId = BigInt(payload.sub);
      
      // Find the user in the database
      const user = await this.userService.findOne(userId);
      
      // If user not found or not active, throw exception
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User inactive or not found');
      }
      
      // Return user data to attach to request object
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
