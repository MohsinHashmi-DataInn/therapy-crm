import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { CreateUserDto } from '../user/dto/create-user.dto';

/**
 * Controller handling authentication endpoints
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
      console.log('Received registration request:', { 
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role 
      });
      
      return await this.authService.register(createUserDto);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Rethrow the error to be handled by NestJS exception filters
      throw error;
    }
  }

  /**
   * Authenticate user and generate JWT token
   */
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and generate JWT token' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
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
  async getProfile(@Request() req: ExpressRequest & { user: { id: bigint } }) {
    return this.authService.getProfile(req.user.id);
  }
}
