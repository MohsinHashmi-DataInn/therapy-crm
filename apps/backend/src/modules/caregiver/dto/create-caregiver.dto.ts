import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Enum for relationship types between caregivers and clients
 */
export enum RelationshipType {
  PARENT = 'PARENT',
  GUARDIAN = 'GUARDIAN',
  GRANDPARENT = 'GRANDPARENT',
  SIBLING = 'SIBLING',
  OTHER_FAMILY = 'OTHER_FAMILY',
  CAREGIVER = 'CAREGIVER',
  ADVOCATE = 'ADVOCATE',
  OTHER = 'OTHER'
}

/**
 * Data Transfer Object for creating a new caregiver
 */
export class CreateCaregiverDto {
  @ApiProperty({ example: 'John', description: 'Caregiver first name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Caregiver last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiProperty({ 
    enum: RelationshipType, 
    example: RelationshipType.PARENT,
    description: 'Relationship to the client' 
  })
  @IsEnum(RelationshipType, { message: 'Relationship must be a valid relationship type' })
  @IsNotEmpty({ message: 'Relationship is required' })
  relationship!: RelationshipType;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Whether this is the primary caregiver for the client' 
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;

  @ApiPropertyOptional({ example: '123-456-7890', description: 'Caregiver phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Caregiver email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Caregiver address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'Caregiver city' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'Caregiver state' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Caregiver ZIP code' })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Whether this caregiver has legal custody of the client' 
  })
  @IsBoolean()
  @IsOptional()
  hasLegalCustody?: boolean = false;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Whether this caregiver should be contacted in case of emergency' 
  })
  @IsBoolean()
  @IsOptional()
  isEmergencyContact?: boolean = false;

  @ApiPropertyOptional({ example: 'Additional information', description: 'Additional notes about the caregiver' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: '1', description: 'ID of the client' })
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId!: string;
}
