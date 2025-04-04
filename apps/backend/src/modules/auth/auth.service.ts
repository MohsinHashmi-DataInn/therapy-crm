import { Injectable, UnauthorizedException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import * as bcrypt from 'bcrypt';

/**
 * Service handling authentication logic
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('Auth service initialized');
  }

  /**
   * Register a new user
   * @param createUserDto - User registration data
   * @returns The created user without password and a JWT token
   */
  async register(createUserDto: CreateUserDto) {
    this.logger.log(`Processing registration request for email: ${createUserDto.email}`);
    
    try {
      // Create user in the database
      const user = await this.userService.create(createUserDto);
      this.logger.log(`User created successfully with ID: ${user.id.toString()}`);
      
      // Generate JWT payload
      const payload: JwtPayload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };
      
      const token = this.jwtService.sign(payload);
      this.logger.debug(`JWT token generated for user: ${user.email}`);
      
      // Return token and user info - convert BigInt to string
      return {
        accessToken: token,
        user: {
          id: user.id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.warn(`Email already in use: ${createUserDto.email}`);
        throw error;
      }
      
      this.logger.error(
        `Error during registration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      // Re-throw the error to be handled by NestJS exception filters
      throw error;
    }
  }

  /**
   * Authenticate user and generate JWT token
   * @param loginDto - Login credentials
   * @returns Access token and user info
   */
  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    
    try {
      // Find user by email
      const user = await this.userService.findByEmail(loginDto.email);
      
      // If user not found or inactive, throw exception
      if (!user || !user.isActive) {
        this.logger.warn(`Login failed: User not found or inactive - ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Verify password exists
      if (!user.password) {
        this.logger.warn(`Login failed: User has no password set - ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Compare password with stored hash
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      
      // If password invalid, throw exception
      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for user - ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      this.logger.log(`User authenticated successfully: ${loginDto.email}`);
      
      // Generate JWT payload
      const payload: JwtPayload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };
      
      const token = this.jwtService.sign(payload);
      this.logger.debug(`JWT token generated for user: ${user.email}`);
      
      // Return token and user info
      return {
        accessToken: token,
        user: {
          id: user.id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      // Don't expose detailed errors to client
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(
        `Error during login: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Get profile of authenticated user
   * @param userId - ID of authenticated user
   * @returns User profile
   */
  async getProfile(userId: bigint) {
    this.logger.log(`Getting profile for user ID: ${userId.toString()}`);
    
    try {
      const user = await this.userService.findOne(userId);
      
      if (!user) {
        this.logger.warn(`User not found with ID: ${userId.toString()}`);
        throw new NotFoundException('User not found');
      }
      
      this.logger.log(`Retrieved profile for user: ${user.email}`);
      
      return {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(
        `Error retrieving user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new NotFoundException('User profile not found');
    }
  }
}
