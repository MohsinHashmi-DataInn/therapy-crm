import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, NotificationPreference } from '@prisma/client';
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
      const existingUser = await this.prismaService.user.findUnique({
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
        role: createUserDto.role || UserRole.STAFF,
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
        const user = await this.prismaService.user.create({
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
    const users = await this.prismaService.user.findMany() as unknown as User[];
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
      const user = await this.prismaService.user.findUnique({
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
  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`[DEBUG] Searching for user by email: ${email}`);
    console.log(`[DEBUG] findByEmail - Searching database for user with email: ${email}`);
    
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      }) as unknown as User | null;
      
      if (user) {
        this.logger.log(`[DEBUG] User found with email: ${email}, ID: ${user.id?.toString()}, Role: ${user.role}`);
        console.log(`[DEBUG] findByEmail - User found:`, {
          id: user.id?.toString(),
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          hasPassword: !!user.password,
          passwordLength: user.password?.length || 0
        });
      } else {
        this.logger.warn(`[DEBUG] No user found with email: ${email}`);
        console.log(`[DEBUG] findByEmail - No user found with email: ${email}`);
      }
      
      return user;
    } catch (error) {
      this.logger.error(`[DEBUG] Error finding user by email: ${email}`, error);
      console.error(`[DEBUG] findByEmail - Database error:`, error);
      throw error;
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
    const updatedUser = await this.prismaService.user.update({
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
    const deletedUser = await this.prismaService.user.delete({
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
  async getNotificationPreferences(userId: bigint): Promise<NotificationPreference | null> {
    this.logger.log(`Fetching notification preferences for user ID: ${userId}`);
    // TODO: Implement database logic to retrieve preferences based on userId
    // Example placeholder implementation:
    const preferences = await this.prismaService.notificationPreference.findUnique({ // Assuming a model named NotificationPreference
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
    const updatedPreferences = await this.prismaService.notificationPreference.upsert({
      where: { userId: userId },
      update: { ...preferencesData, userId }, // Ensure userId is included if needed for update
      create: { ...preferencesData, userId }, // Ensure userId is linked on creation
    });

    this.logger.log(`Notification preferences updated successfully for user ID: ${userId}`);
    return updatedPreferences;
  }
}
