import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Client first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Client last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Client email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Client phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Client address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Client date of birth' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the client' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateClientDto {
  @ApiPropertyOptional({ description: 'Client first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Client last name' })
  @IsString()
  @IsOptional()
  lastName?: string;
  
  @ApiPropertyOptional({ description: 'Client email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Client phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Client address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Client date of birth' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the client' })
  @IsString()
  @IsOptional()
  notes?: string;
}
