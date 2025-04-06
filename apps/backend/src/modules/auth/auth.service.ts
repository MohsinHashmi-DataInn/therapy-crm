import { Injectable, UnauthorizedException, ConflictException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailService } from '../../common/email/email.service';
import { forgotPasswordTemplate } from './templates/forgot-password.template';
import { emailVerificationTemplate } from './templates/email-verification.template';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Service handling authentication logic
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
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
      
      // Generate email verification token
      await this.sendEmailVerification(user.email);
      
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
          isEmailVerified: user.is_email_verified,
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
    this.logger.log(`[DEBUG] Login attempt for email: ${loginDto.email}`);
    console.log(`[DEBUG] LOGIN ATTEMPT - Email: ${loginDto.email}, Password length: ${loginDto.password?.length || 0}`);
    
    try {
      // Find user by email
      this.logger.log(`[DEBUG] Searching for user with email: ${loginDto.email}`);
      const user = await this.userService.findByEmail(loginDto.email);
      console.log(`[DEBUG] User search result:`, user ? `Found user with ID: ${user.id}` : 'User not found');
      
      // If user not found or inactive, throw exception
      if (!user) {
        this.logger.warn(`[DEBUG] Login failed: User not found - ${loginDto.email}`);
        console.log(`[DEBUG] LOGIN FAILED - User not found: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      if (!user.isActive) {
        this.logger.warn(`[DEBUG] Login failed: User is inactive - ${loginDto.email}`);
        console.log(`[DEBUG] LOGIN FAILED - User inactive: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Verify password exists
      if (!user.password) {
        this.logger.warn(`[DEBUG] Login failed: User has no password set - ${loginDto.email}`);
        console.log(`[DEBUG] LOGIN FAILED - No password set for user: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Compare password with stored hash
      console.log(`[DEBUG] Comparing password: Input length ${loginDto.password?.length || 0}, Stored hash length: ${user.password?.length || 0}`);
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      console.log(`[DEBUG] Password validation result: ${isPasswordValid ? 'Valid' : 'Invalid'}`);
      
      // If password invalid, throw exception
      if (!isPasswordValid) {
        this.logger.warn(`[DEBUG] Login failed: Invalid password for user - ${loginDto.email}`);
        console.log(`[DEBUG] LOGIN FAILED - Invalid password for: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      this.logger.log(`[DEBUG] User authenticated successfully: ${loginDto.email}`);
      console.log(`[DEBUG] LOGIN SUCCESS - User authenticated: ${loginDto.email}, Role: ${user.role}`);
      
      // Generate JWT payload
      const payload: JwtPayload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };
      console.log(`[DEBUG] JWT payload:`, JSON.stringify(payload));
      
      const token = this.jwtService.sign(payload);
      this.logger.debug(`[DEBUG] JWT token generated for user: ${user.email}`);
      console.log(`[DEBUG] JWT token generated, length: ${token?.length || 0}`);
      
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
        console.log(`[DEBUG] LOGIN ERROR - UnauthorizedException: ${error.message}`);
        throw error;
      }
      
      this.logger.error(
        `[DEBUG] Error during login: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      console.log(`[DEBUG] LOGIN ERROR - Unexpected error:`, error instanceof Error ? error.message : 'Unknown error');
      console.log(error instanceof Error ? error.stack : 'No stack trace available');
      
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
        isEmailVerified: user.is_email_verified,
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

  /**
   * Send email verification link to user
   * @param email - Email address to send verification link to
   * @returns Boolean indicating success
   */
  async sendEmailVerification(email: string): Promise<boolean> {
    try {
      const user = await this.userService.findByEmail(email);
      
      if (!user) {
        this.logger.warn(`Email verification failed: User not found with email ${email}`);
        throw new NotFoundException('User not found');
      }
      
      if (user.isEmailVerified) {
        this.logger.warn(`Email already verified for user ${email}`);
        throw new BadRequestException('Email already verified');
      }
      
      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24); // 24-hour expiry
      
      // Save token to user record
      await this.userService.updateEmailVerificationToken(user.id, token, expiryDate);
      
      // Generate verification link
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      // Send verification email
      const emailContent = emailVerificationTemplate(user.firstName, verificationLink);
      await this.emailService.sendHtmlEmail(
        { email: user.email, name: `${user.firstName} ${user.lastName}` },
        'Verify Your Email Address',
        emailContent
      );
      
      this.logger.log(`Email verification sent to ${email}`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(
        `Error sending email verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new BadRequestException('Failed to send verification email');
    }
  }

  /**
   * Verify user email using token
   * @param verifyEmailDto - DTO containing verification token
   * @returns Boolean indicating success
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<boolean> {
    try {
      const { token } = verifyEmailDto;
      
      // Find user with this token
      const user = await this.userService.findByEmailVerificationToken(token);
      
      if (!user) {
        this.logger.warn('Email verification failed: Invalid or expired token');
        throw new BadRequestException('Invalid or expired verification token');
      }
      
      // Check if token is expired
      if (user.emailVerificationTokenExpires && new Date() > user.emailVerificationTokenExpires) {
        this.logger.warn(`Email verification token expired for user ${user.email}`);
        throw new BadRequestException('Verification token has expired');
      }
      
      // Mark email as verified and clear token
      await this.userService.markEmailAsVerified(user.id);
      
      this.logger.log(`Email verified successfully for user ${user.email}`);
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(
        `Error verifying email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new BadRequestException('Failed to verify email');
    }
  }

  /**
   * Send password reset link to user
   * @param forgotPasswordDto - DTO containing user email
   * @returns Boolean indicating success
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<boolean> {
    try {
      const { email } = forgotPasswordDto;
      
      const user = await this.userService.findByEmail(email);
      
      if (!user) {
        // For security reasons, don't reveal if the email exists or not
        this.logger.warn(`Password reset requested for non-existent email: ${email}`);
        return true; // Still return true to prevent email enumeration
      }
      
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // 1-hour expiry
      
      // Save token to user record
      await this.userService.updatePasswordResetToken(user.id, token, expiryDate);
      
      // Generate reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      // Send reset email
      const emailContent = forgotPasswordTemplate(user.firstName, resetLink);
      await this.emailService.sendHtmlEmail(
        { email: user.email, name: `${user.firstName} ${user.lastName}` },
        'Reset Your Password',
        emailContent
      );
      
      this.logger.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error processing forgot password request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new BadRequestException('Failed to process password reset request');
    }
  }

  /**
   * Reset user password using token
   * @param resetPasswordDto - DTO containing reset token and new password
   * @returns Boolean indicating success
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<boolean> {
    try {
      const { token, password, confirmPassword } = resetPasswordDto;
      
      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }
      
      // Find user with this token
      const user = await this.userService.findByPasswordResetToken(token);
      
      if (!user) {
        this.logger.warn('Password reset failed: Invalid or expired token');
        throw new BadRequestException('Invalid or expired reset token');
      }
      
      // Check if token is expired
      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        this.logger.warn(`Password reset token expired for user ${user.email}`);
        throw new BadRequestException('Reset token has expired');
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update password and clear reset token
      await this.userService.resetPassword(user.id, hashedPassword);
      
      this.logger.log(`Password reset successfully for user ${user.email}`);
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(
        `Error resetting password: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new BadRequestException('Failed to reset password');
    }
  }
}
