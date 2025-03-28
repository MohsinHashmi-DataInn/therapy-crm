import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
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
   * Register a new user
   * @param createUserDto - User registration data
   * @returns The created user without password and a JWT token
   */
  async register(createUserDto: CreateUserDto) {
    try {
      console.log('AuthService.register - Processing registration request:', createUserDto.email);
      
      // Create user in the database
      const user = await this.userService.create(createUserDto);
      
      console.log('AuthService.register - User created successfully');
      
      // Generate JWT payload
      const payload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };
      
      // Return token and user info - convert BigInt to string
      return {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id.toString(), // Convert BigInt to string
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error: any) {
      // Provide detailed logging for debugging
      console.error('AuthService.register - Error during registration:', error);
      
      // Re-throw the error to be handled by NestJS exception filters
      if (error instanceof ConflictException) {
        console.error('AuthService.register - Email already in use');
        throw error;
      }
      
      // For debugging purposes, log the detailed error
      console.error('AuthService.register - Unhandled error:', error.message, error.stack);
      
      // Throw a generic error to avoid exposing sensitive information
      throw error;
    }
  }

  /**
   * Authenticate user and generate JWT token
   * @param loginDto - Login credentials
   * @returns Access token and user info
   */
  async login(loginDto: LoginDto) {
    console.log('AuthService.login - Login attempt for email:', loginDto.email);
    
    // Find user by email
    const user = await this.userService.findByEmail(loginDto.email);
    
    console.log('AuthService.login - User found:', user ? 'Yes' : 'No');
    
    // If user not found or inactive, throw exception
    if (!user || !user.isActive) {
      console.log('AuthService.login - User not found or inactive');
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Compare password with stored hash
    if (!user.password) {
      console.log('AuthService.login - User has no password set');
      throw new UnauthorizedException('Invalid credentials');
    }
    
    console.log('AuthService.login - Comparing password hash');
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    console.log('AuthService.login - Password valid:', isPasswordValid ? 'Yes' : 'No');
    
    // If password invalid, throw exception
    if (!isPasswordValid) {
      console.log('AuthService.login - Invalid password');
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
        id: user.id.toString(), // Convert BigInt to string
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
    const user = await this.userService.findOne(userId);
    return {
      id: user.id.toString(), // Convert BigInt to string
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
