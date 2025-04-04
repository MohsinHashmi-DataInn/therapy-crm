import { Controller, Post, Body, Get, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MockAuthService } from './auth.service.mock';
import { LoginDto } from '../../src/modules/auth/dto/login.dto';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { CreateUserDto } from '../../src/modules/user/dto/create-user.dto';

/**
 * Mock Controller handling authentication endpoints for testing
 */
@ApiTags('auth')
@Controller('auth')
export class MockAuthController {
  constructor(private readonly authService: MockAuthService) {}

  /**
   * Register a new user
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      console.log('Mock controller - Received registration request:', { 
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role 
      });
      
      return await this.authService.register(createUserDto);
    } catch (error: any) {
      console.error('Mock controller - Registration error:', error);
      
      // Rethrow the error to be handled by NestJS exception filters
      throw error;
    }
  }

  /**
   * Authenticate user and generate JWT token
   */
  @Post('login')
  @HttpCode(200) // Force HTTP 200 status code for login
  @ApiOperation({ summary: 'Authenticate user and generate JWT token' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    console.log('Mock controller - Login attempt:', loginDto.email);
    return this.authService.login(loginDto);
  }

  /**
   * Get profile of authenticated user
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile of authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: ExpressRequest & { user: { id: string | bigint } }) {
    console.log('Mock controller - Get profile for user ID:', req.user.id);
    return this.authService.getProfile(req.user.id);
  }
}
