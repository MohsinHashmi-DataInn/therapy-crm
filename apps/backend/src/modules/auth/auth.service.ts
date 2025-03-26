import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

/**
 * Service handling authentication logic
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticate user and generate JWT token
   * @param loginDto - Login credentials
   * @returns Access token and user info
   */
  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.userService.findByEmail(loginDto.email);
    
    // If user not found or inactive, throw exception
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Compare password with stored hash
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    // If password invalid, throw exception
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Generate JWT payload
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };
    
    // Return token and user info
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Get profile of authenticated user
   * @param userId - ID of authenticated user
   * @returns User profile
   */
  async getProfile(userId: bigint) {
    return this.userService.findOne(userId);
  }
}
