import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Define enums locally to match schema
export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  WAITLIST = 'WAITLIST'
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Data Transfer Object for creating a new client
 */
export class CreateClientDto {
  @ApiProperty({ example: 'John', description: 'Client first name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Client last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Client email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '123-456-7890', description: 'Client phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone!: string;

  @ApiPropertyOptional({ example: '123 Main St, City, State, Zip', description: 'Client address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ 
    enum: ClientStatus, 
    default: ClientStatus.ACTIVE, 
    description: 'Client status' 
  })
  @IsEnum(ClientStatus, { message: 'Status must be a valid client status' })
  @IsOptional()
  status?: ClientStatus = ClientStatus.ACTIVE;

  @ApiPropertyOptional({ 
    enum: Priority, 
    default: Priority.MEDIUM, 
    description: 'Client priority' 
  })
  @IsEnum(Priority, { message: 'Priority must be a valid priority level' })
  @IsOptional()
  priority?: Priority = Priority.MEDIUM;

  @ApiPropertyOptional({ example: 'Referred by Dr. Smith', description: 'Additional notes about the client' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '1', description: 'ID of assigned therapist' })
  @IsOptional()
  therapistId?: string;
}
