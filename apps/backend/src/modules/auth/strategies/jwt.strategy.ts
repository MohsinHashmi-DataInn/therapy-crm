import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * JWT payload interface for type safety
 */
export interface JwtPayload {
  sub: string;     // User ID as string
  email: string;   // User email
  role: string;    // User role
  iat?: number;    // Issued at timestamp
  exp?: number;    // Expiration timestamp
}

/**
 * JWT Strategy for authentication
 * Validates JWT tokens and returns the user data
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
    this.logger.log('JWT Strategy initialized');
  }

  /**
   * Validate the JWT payload and return the user data
   * @param payload The JWT payload
   * @returns The user data with ID as BigInt
   */
  async validate(payload: JwtPayload) {
    this.logger.debug(`Validating token payload: ${JSON.stringify(payload)}`);
    
    if (!payload || !payload.sub) {
      this.logger.error('Invalid token payload: missing user ID');
      throw new UnauthorizedException('Invalid token');
    }
    
    try {
      // Convert string ID to BigInt
      const userId = BigInt(payload.sub);
      this.logger.log(`Looking up user with ID: ${userId.toString()}`);
      
      // Find the user in the database
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        this.logger.warn(`User not found for ID: ${userId.toString()}`);
        throw new UnauthorizedException('User not found');
      }
      
      if (!user.is_active) {
        this.logger.warn(`User account is inactive: ${userId.toString()}`);
        throw new UnauthorizedException('User account is inactive');
      }
      
      this.logger.log(`Successfully authenticated user: ${user.email}`);
      
      // Return user data to be attached to the request object
      return {
        id: user.id,         // BigInt ID
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      };
    } catch (error) {
      this.logger.error(
        `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
