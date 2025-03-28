import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

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
        role: createUserDto.role || 'STAFF',
        isActive: true,
        createdBy: createdById ? createdById : null,
        createdAt: new Date(),
        updatedAt: null,
        updatedBy: null
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
    return this.prismaService.user.findUnique({
      where: { email },
    }) as unknown as User | null;
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
}
