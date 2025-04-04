import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { TEST_USERS } from '../setup';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../../src/modules/user/dto/create-user.dto';

/**
 * Mock AuthService for testing purposes
 * This service bypasses password verification for test users
 */
@Injectable()
export class MockAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  
  /**
   * Register a new user in the mock service
   * @param createUserDto - User registration data
   * @returns The created user without password and a JWT token
   */
  async register(createUserDto: CreateUserDto) {
    console.log('MockAuthService.register - Processing registration request:', createUserDto.email);
    
    try {
      // Check if user with this email already exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { email: createUserDto.email }
      });
      
      if (existingUser) {
        console.error('MockAuthService.register - Email already in use');
        throw new ConflictException({
          statusCode: 409,
          message: 'Email already exists',
          error: 'Conflict'
        });
      }
      
      // Hash the password
      const SALT_ROUNDS = 10;
      const hashedPassword = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);
      
      // Create the user in the database
      const user = await this.prismaService.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          role: createUserDto.role || 'THERAPIST',
          phone: createUserDto.phone,
          isActive: true,
        },
      });
      
      console.log('MockAuthService.register - User created successfully with ID:', user.id.toString());
      
      // Generate JWT payload with proper format for JwtStrategy
      const payload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };
      
      console.log('MockAuthService.register - Generated JWT payload:', payload);
      
      // Create a token that will work with our JWT strategy
      const token = this.jwtService.sign(payload);
      console.log('MockAuthService.register - Generated token:', token);
      
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
    } catch (error: any) {
      console.error('MockAuthService.register - Error during registration:', error);
      
      // Handle Prisma unique constraint violation (P2002) for email
      if (error.code === 'P2002') {
        console.error('MockAuthService.register - Email already in use');
        throw new ConflictException({
          statusCode: 409,
          message: 'Email already exists',
          error: 'Conflict'
        });
      }
      
      // Log detailed error for debugging
      console.error('MockAuthService.register - Detailed error:', {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      
      throw error;
    }
  }

  /**
   * Mock login method that accepts test user credentials without password verification
   */
  async login(loginDto: { email: string; password: string }) {
    console.log('MockAuthService.login - Login attempt for email:', loginDto.email);
    
    try {
      // Ensure we return status 200 for login by not using HttpStatus.CREATED
      // Check for test users first
      if (loginDto.email === TEST_USERS.admin.email && loginDto.password === TEST_USERS.admin.password) {
        console.log('MockAuthService.login - Admin test user detected, bypassing verification');
        
        // Find the actual admin user in the database
        const dbUser = await this.prismaService.user.findUnique({
          where: { email: TEST_USERS.admin.email }
        });
        
        if (!dbUser) {
          console.log('MockAuthService.login - Admin user not found in database');
          throw new UnauthorizedException('User not found');
        }
        
        console.log('MockAuthService.login - Found admin user with ID:', dbUser.id.toString());
        
        // Generate JWT payload with proper format for JwtStrategy
        const payload = {
          sub: dbUser.id.toString(),
          email: dbUser.email,
          role: dbUser.role,
        };
        
        console.log('MockAuthService.login (staff) - Generated JWT payload:', payload);
        
        // Create a token that will work with our JWT strategy
        const token = this.jwtService.sign(payload);
        console.log('MockAuthService.login (staff) - Generated token:', token);
        
        // Return success response with token and user info
        return {
          accessToken: token,
          user: {
            id: dbUser.id.toString(),
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            role: dbUser.role,
          },
        };
      } else if (loginDto.email === TEST_USERS.staff.email && loginDto.password === TEST_USERS.staff.password) {
        console.log('MockAuthService.login - Staff test user detected, bypassing verification');
        
        // Find the actual staff user in the database
        const dbUser = await this.prismaService.user.findUnique({
          where: { email: TEST_USERS.staff.email }
        });
        
        if (!dbUser) {
          console.log('MockAuthService.login - Staff user not found in database');
          throw new UnauthorizedException('User not found');
        }
        
        console.log('MockAuthService.login - Found staff user with ID:', dbUser.id.toString());
        
        // Generate JWT payload with proper format for JwtStrategy
        const payload = {
          sub: dbUser.id.toString(),
          email: dbUser.email,
          role: dbUser.role,
        };
        
        console.log('MockAuthService.login (staff) - Generated JWT payload:', payload);
        
        // Create a token that will work with our JWT strategy
        const token = this.jwtService.sign(payload);
        console.log('MockAuthService.login (staff) - Generated token:', token);
        
        // Return success response with token and user info
        return {
          accessToken: token,
          user: {
            id: dbUser.id.toString(),
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            role: dbUser.role,
          },
        };
      } else {
        // For regular users, find them in the database and verify password
        console.log('MockAuthService.login - Regular user login attempt');
        
        // Find the user in the database
        const user = await this.prismaService.user.findUnique({
          where: { email: loginDto.email }
        });
        
        if (!user) {
          console.log('MockAuthService.login - User not found in database');
          throw new UnauthorizedException('Invalid credentials');
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        
        if (!isPasswordValid) {
          console.log('MockAuthService.login - Invalid password');
          throw new UnauthorizedException('Invalid credentials');
        }
        
        console.log('MockAuthService.login - Login successful for user ID:', user.id.toString());
        
        // Generate JWT payload with proper format for JwtStrategy
        const payload = {
          sub: user.id.toString(),
          email: user.email,
          role: user.role,
        };
        
        console.log('MockAuthService.login - Generated JWT payload:', payload);
        
        // Create a token that will work with our JWT strategy
        const token = this.jwtService.sign(payload);
        console.log('MockAuthService.login - Generated token:', token);
        
        // Return success response with token and user info
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
      }
    } catch (error) {
      console.error('MockAuthService.login - Error during login:', error);
      throw new UnauthorizedException('Authentication failed or token expired');
    }
  }

  /**
   * Simplified mock profile method that returns user profile for test users
   * For testing purposes, this method will always return a valid profile
   */
  async getProfile(userId: string | bigint) {
    console.log('MockAuthService.getProfile - Getting profile for user ID:', userId ? userId.toString() : 'undefined');
    
    // For testing purposes in the mock, just use a predefined value based on the user ID
    const userIdStr = userId ? userId.toString() : '1';
    
    // Return admin profile for ID 1
    if (userIdStr === '1') {
      return {
        id: '1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      };
    }
    
    // Return staff profile for ID 2
    if (userIdStr === '2') {
      return {
        id: '2',
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'STAFF',
      };
    }
    
    // For any other ID, return a generic user profile
    return {
      id: userIdStr,
      email: `user-${userIdStr}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'THERAPIST',
    };
  }
}
