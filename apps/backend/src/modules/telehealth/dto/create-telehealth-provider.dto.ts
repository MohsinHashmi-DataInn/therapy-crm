import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsObject } from 'class-validator';

export class CreateTelehealthProviderDto {
  @ApiProperty({ description: 'Name of the telehealth provider' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'API key for the telehealth provider' })
  @IsString()
  @IsNotEmpty()
  api_key: string;

  @ApiProperty({ description: 'API secret for the telehealth provider' })
  @IsString()
  @IsNotEmpty()
  api_secret: string;

  @ApiProperty({ description: 'Base URL for the telehealth provider API' })
  @IsString()
  @IsNotEmpty()
  base_url: string;

  @ApiPropertyOptional({ description: 'Logo URL for the telehealth provider' })
  @IsString()
  @IsOptional()
  logo_url?: string;

  @ApiProperty({ 
    description: 'Provider type', 
    enum: ['ZOOM', 'DOXY', 'MICROSOFT_TEAMS', 'GOOGLE_MEET', 'CUSTOM'] 
  })
  @IsString()
  @IsNotEmpty()
  provider_type: string;

  @ApiPropertyOptional({ description: 'Whether the provider is active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional configuration for the provider' })
  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ID of the user who created the provider' })
  @IsOptional()
  created_by?: string;

  @ApiPropertyOptional({ description: 'ID of the user who updated the provider' })
  @IsOptional()
  updated_by?: string;
}
