import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

// Define User interface locally to match the Prisma schema
export interface User {
  id: bigint;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: bigint;
  updatedBy?: bigint | null;
}

/**
 * Service handling user-related business logic
 */
@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new user
   * @param createUserDto - Data for creating the user
   * @param createdById - ID of the user creating this record
   * @returns The created user without the password
   */
  async create(createUserDto: CreateUserDto, createdById?: bigint): Promise<Omit<User, 'password'>> {
    // Check if email already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prismaService.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: hashedPassword,
        phone: createUserDto.phone,
        role: createUserDto.role,
        createdBy: createdById,
      },
    }) as unknown as User;

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find all users
   * @returns Array of users without passwords
   */
  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prismaService.user.findMany() as unknown as User[];
    return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  }

  /**
   * Find a user by ID
   * @param id - User ID
   * @returns The found user without the password
   */
  async findOne(id: bigint): Promise<Omit<User, 'password'>> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    }) as unknown as User | null;

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find a user by email with password included (for auth purposes)
   * @param email - User email
   * @returns The found user including password
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
  async update(id: bigint, updateUserDto: UpdateUserDto, updatedById?: bigint): Promise<Omit<User, 'password'>> {
    // Check if user exists
    await this.findOne(id);

    // Check if email is being updated and if it's already in use
    if (updateUserDto.email) {
      const existingUser = await this.prismaService.user.findUnique({
        where: { email: updateUserDto.email },
      }) as unknown as User | null;

      if (existingUser && existingUser.id.toString() !== id.toString()) {
        throw new ConflictException('Email already in use');
      }
    }

    // Update the user
    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updatedAt: new Date(),
        updatedBy: updatedById,
      },
    }) as unknown as User;

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Remove a user
   * @param id - User ID
   * @returns The removed user without the password
   */
  async remove(id: bigint): Promise<Omit<User, 'password'>> {
    // Check if user exists
    await this.findOne(id);

    // Delete the user
    const deletedUser = await this.prismaService.user.delete({
      where: { id },
    }) as unknown as User;

    // Return user without password
    const { password, ...userWithoutPassword } = deletedUser;
    return userWithoutPassword;
  }
}
