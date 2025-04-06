import { ConflictException, Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../types/prisma-models';

// Define types locally until we resolve import issues
type User = any;
type NotificationPreference = any;
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import * as bcrypt from 'bcrypt';

// Define a type for serialized user (with ID as string instead of BigInt)
export type SerializedUser = Omit<User, 'password' | 'id' | 'createdBy' | 'updatedBy'> & {
  id: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new user
   * @param createUserDto - Data for creating the user
   * @param createdById - ID of the user creating this record
   * @returns The created user without the password
   */
  async create(createUserDto: CreateUserDto, createdById?: bigint): Promise<SerializedUser> {
    try {
      console.log('UserService.create - Creating user with email:', createUserDto.email);
      
      // Check if email already exists
      const existingUser = await this.prismaService.users.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        console.log('UserService.create - Email already exists:', createUserDto.email);
        throw new ConflictException('Email already in use');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      console.log('UserService.create - Password hashed successfully');

      // Create default data for mock implementation
      const defaultUserData = {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: hashedPassword,
        phone: createUserDto.phone,
        role: createUserDto.role || UserRole.RECEPTIONIST, // Using RECEPTIONIST as default role
        isActive: true,
        createdBy: createdById ? createdById : null,
        // Use proper Prisma types for dates - use undefined instead of null
        createdAt: new Date(),
        // Exclude updatedAt and updatedBy to let Prisma handle them with default values
      };

      console.log('UserService.create - Attempting to create user with data:', {
        ...defaultUserData,
        password: '[REDACTED]',
      });

      // Create user
      try {
        const user = await this.prismaService.users.create({
          data: defaultUserData,
        }) as unknown as User;
        
        console.log('UserService.create - User created successfully with ID:', user.id?.toString());
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          id: userWithoutPassword.id?.toString() || '',
          createdBy: userWithoutPassword.createdBy?.toString() || null,
          updatedBy: userWithoutPassword.updatedBy?.toString() || null
        };
      } catch (createError: any) {
        console.error('UserService.create - Error creating user in database:', createError.message);
        throw createError;
      }
    } catch (error: any) {
      console.error('UserService.create - Error in create method:', error.message);
      
      // Re-throw the specific error if it's already classified
      if (error instanceof ConflictException) {
        throw error;
      }
      
      // For other errors, provide a consistent error message
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Find all users
   * @returns Array of users without passwords
   */
  async findAll(): Promise<SerializedUser[]> {
    const users = await this.prismaService.users.findMany() as unknown as User[];
    return users.map(user => {
      // Convert id from BigInt to string for JSON serialization
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        id: userWithoutPassword.id?.toString() || '',
        createdBy: userWithoutPassword.createdBy?.toString() || null,
        updatedBy: userWithoutPassword.updatedBy?.toString() || null
      };
    });
  }

  /**
   * Find a user by ID
   * @param id - User ID
   * @returns User without password
   */
  async findOne(id: bigint): Promise<SerializedUser> {
    try {
      const user = await this.prismaService.users.findUnique({
        where: { id },
      }) as unknown as User;

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Convert BigInt values to strings for JSON serialization
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        id: userWithoutPassword.id?.toString() || '',
        createdBy: userWithoutPassword.createdBy?.toString() || null,
        updatedBy: userWithoutPassword.updatedBy?.toString() || null
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Find a user by email
   * @param email - User's email
   * @returns User or null if not found
   */
  async findByEmail(email: string) {
    this.logger.log(`Finding user by email: ${email}`);
    
    try {
      const user = await this.prismaService.users.findUnique({
        where: { email },
      });
      
      if (!user) {
        this.logger.warn(`User not found with email: ${email}`);
        return null;
      }
      
      return this.mapUserResponse(user);
    } catch (error) {
      this.logger.error(
        `Error finding user by email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new InternalServerErrorException('Error finding user by email');
    }
  }
  
  /**
   * Find a user by their email verification token
   * @param token - Email verification token
   * @returns User object or null if not found
   */
  async findByEmailVerificationToken(token: string) {
    this.logger.log('Finding user by email verification token');
    
    try {
      const users = await this.prismaService.$queryRaw`
        SELECT * FROM "users" 
        WHERE "email_verification_token" = ${token} 
        LIMIT 1
      `;
      
      const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
      
      if (!user) {
        this.logger.warn('No user found with the provided email verification token');
        return null;
      }
      
      return this.mapUserResponse(user);
    } catch (error) {
      this.logger.error(
        `Error finding user by email verification token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new InternalServerErrorException('Error finding user by email verification token');
    }
  }
  
  /**
   * Find a user by their password reset token
   * @param token - Password reset token
   * @returns User object or null if not found
   */
  async findByPasswordResetToken(token: string) {
    this.logger.log('Finding user by password reset token');
    
    try {
      const users = await this.prismaService.$queryRaw`
        SELECT * FROM "users" 
        WHERE "password_reset_token" = ${token} 
        LIMIT 1
      `;
      
      const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
      
      if (!user) {
        this.logger.warn('No user found with the provided password reset token');
        return null;
      }
      
      return this.mapUserResponse(user);
    } catch (error) {
      this.logger.error(
        `Error finding user by password reset token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new InternalServerErrorException('Error finding user by password reset token');
    }
  }

  /**
   * Update a user
   * @param id - User ID
   * @param updateUserDto - Data for updating the user
   * @param updatedById - ID of the user making the update
   * @returns The updated user without the password
   */
  async update(id: bigint, updateUserDto: UpdateUserDto, updatedById?: bigint): Promise<SerializedUser> {
    // Check if user exists
    await this.findOne(id);

    // Hash password if it's being updated
    let data: any = { ...updateUserDto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    data.updatedAt = new Date();
    data.updatedBy = updatedById;

    // Update user
    const updatedUser = await this.prismaService.users.update({
      where: { id },
      data,
    }) as unknown as User;

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return {
      ...userWithoutPassword,
      id: userWithoutPassword.id?.toString() || '',
      createdBy: userWithoutPassword.createdBy?.toString() || null,
      updatedBy: userWithoutPassword.updatedBy?.toString() || null
    };
  }

  /**
   * Delete a user
   * @param id - User ID
   * @returns The deleted user without the password
   */
  async remove(id: bigint): Promise<SerializedUser> {
    // Check if user exists
    await this.findOne(id);

    // Delete user
    const deletedUser = await this.prismaService.users.delete({
      where: { id },
    }) as unknown as User;

    // Return user without password
    const { password, ...userWithoutPassword } = deletedUser;
    return {
      ...userWithoutPassword,
      id: userWithoutPassword.id?.toString() || '',
      createdBy: userWithoutPassword.createdBy?.toString() || null,
      updatedBy: userWithoutPassword.updatedBy?.toString() || null
    };
  }

  /**
   * Get notification preferences for a user
   * @param userId - The ID of the user
   * @returns Notification preferences object
   */
  /**
   * Update the email verification token for a user
   * @param userId - User ID
   * @param token - Email verification token
   * @param expiryDate - Expiry date for the token
   * @returns Updated user object
   */
  async updateEmailVerificationToken(userId: bigint, token: string, expiryDate: Date) {
    this.logger.log(`Updating email verification token for user ID: ${userId.toString()}`);
    
    try {
      await this.prismaService.$executeRaw`
        UPDATE "users" 
        SET "email_verification_token" = ${token}, 
            "email_verification_token_expires" = ${expiryDate} 
        WHERE "id" = ${userId}
      `;
      
      const users = await this.prismaService.$queryRaw`
        SELECT * FROM "users" 
        WHERE "id" = ${userId} 
        LIMIT 1
      `;
      
      const updatedUser = Array.isArray(users) && users.length > 0 ? users[0] : null;
      
      return this.mapUserResponse(updatedUser);
    } catch (error) {
      this.logger.error(
        `Error updating email verification token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new InternalServerErrorException('Error updating email verification token');
    }
  }
  
  /**
   * Mark a user's email as verified
   * @param userId - User ID
   * @returns Updated user object
   */
  async markEmailAsVerified(userId: bigint) {
    this.logger.log(`Marking email as verified for user ID: ${userId.toString()}`);
    
    try {
      await this.prismaService.$executeRaw`
        UPDATE "users" 
        SET "is_email_verified" = true, 
            "email_verification_token" = NULL, 
            "email_verification_token_expires" = NULL 
        WHERE "id" = ${userId}
      `;
      
      const users = await this.prismaService.$queryRaw`
        SELECT * FROM "users" 
        WHERE "id" = ${userId} 
        LIMIT 1
      `;
      
      const updatedUser = Array.isArray(users) && users.length > 0 ? users[0] : null;
      
      return this.mapUserResponse(updatedUser);
    } catch (error) {
      this.logger.error(
        `Error marking email as verified: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new InternalServerErrorException('Error marking email as verified');
    }
  }
  
  /**
   * Update the password reset token for a user
   * @param userId - User ID
   * @param token - Password reset token
   * @param expiryDate - Expiry date for the token
   * @returns Updated user object
   */
  async updatePasswordResetToken(userId: bigint, token: string, expiryDate: Date) {
    this.logger.log(`Updating password reset token for user ID: ${userId.toString()}`);
    
    try {
      await this.prismaService.$executeRaw`
        UPDATE "users" 
        SET "password_reset_token" = ${token}, 
            "password_reset_expires" = ${expiryDate} 
        WHERE "id" = ${userId}
      `;
      
      const users = await this.prismaService.$queryRaw`
        SELECT * FROM "users" 
        WHERE "id" = ${userId} 
        LIMIT 1
      `;
      
      const updatedUser = Array.isArray(users) && users.length > 0 ? users[0] : null;
      
      return this.mapUserResponse(updatedUser);
    } catch (error) {
      this.logger.error(
        `Error updating password reset token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new InternalServerErrorException('Error updating password reset token');
    }
  }
  
  /**
   * Reset a user's password
   * @param userId - User ID
   * @param newPassword - New hashed password
   * @returns Updated user object
   */
  async resetPassword(userId: bigint, newPassword: string) {
    this.logger.log(`Resetting password for user ID: ${userId.toString()}`);
    
    try {
      const now = new Date();
      
      await this.prismaService.$executeRaw`
        UPDATE "users" 
        SET "password" = ${newPassword}, 
            "password_reset_token" = NULL, 
            "password_reset_expires" = NULL, 
            "last_password_change" = ${now} 
        WHERE "id" = ${userId}
      `;
      
      const users = await this.prismaService.$queryRaw`
        SELECT * FROM "users" 
        WHERE "id" = ${userId} 
        LIMIT 1
      `;
      
      const updatedUser = Array.isArray(users) && users.length > 0 ? users[0] : null;
      
      return this.mapUserResponse(updatedUser);
    } catch (error) {
      this.logger.error(
        `Error resetting password: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw new InternalServerErrorException('Error resetting password');
    }
  }
  
  /**
   * Map user DB model to response object
   * @param user - User from database
   * @returns User response object
   */
  private mapUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      createdBy: user.created_by,
      updatedBy: user.updated_by,
      isEmailVerified: user.is_email_verified,
      emailVerificationToken: user.email_verification_token,
      emailVerificationTokenExpires: user.email_verification_token_expires,
      passwordResetToken: user.password_reset_token,
      passwordResetExpires: user.password_reset_expires,
      lastPasswordChange: user.last_password_change,
    };
  }

  async getNotificationPreferences(userId: bigint): Promise<NotificationPreference | null> {
    this.logger.log(`Fetching notification preferences for user ID: ${userId}`);
    // TODO: Implement database logic to retrieve preferences based on userId
    // Example placeholder implementation:
    const preferences = await this.prismaService.notification_preferences.findUnique({ 
      where: { userId: userId },
    });

    if (!preferences) {
      this.logger.warn(`Notification preferences not found for user ID: ${userId}. Returning null.`);
      // Return null if not found, controller can decide default behavior if needed
      return null;
      // Alternative: return default preferences
      /* return {
        id: BigInt(0), // Placeholder ID
        userId: userId,
        emailNotifications: true, 
        smsNotifications: false, 
        pushNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }; */
    }
    return preferences;
  }

  /**
   * Update notification preferences for a user
   * @param userId - The ID of the user
   * @param preferencesData - The new preferences data
   * @returns The updated preferences object
   */
  async updateNotificationPreferences(
    userId: bigint, 
    preferencesData: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreference> {
    this.logger.log(`Updating notification preferences for user ID: ${userId}`);
    // TODO: Add validation for preferencesData (already handled by DTO)
    // TODO: Implement database logic to update or create preferences
    // Example placeholder implementation (upsert):
    const updatedPreferences = await this.prismaService.notification_preferences.upsert({
      where: { userId: userId },
      update: { ...preferencesData, userId }, // Ensure userId is included if needed for update
      create: { ...preferencesData, userId }, // Ensure userId is linked on creation
    });

    this.logger.log(`Notification preferences updated successfully for user ID: ${userId}`);
    return updatedPreferences;
  }
}
