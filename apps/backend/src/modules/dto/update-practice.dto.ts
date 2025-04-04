import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsUrl, MaxLength } from 'class-validator';

export class UpdatePracticeDto {
  @ApiPropertyOptional({ description: 'The name of the practice', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Street address of the practice', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: 'City of the practice', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State or province of the practice', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Zip or postal code of the practice', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Contact phone number of the practice', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact email address of the practice', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Website URL of the practice', maxLength: 255 })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ description: 'Hours of operation (text or JSON string)', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  hoursOfOperation?: string;
}
