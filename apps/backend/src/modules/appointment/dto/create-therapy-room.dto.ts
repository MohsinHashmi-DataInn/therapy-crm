import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Data Transfer Object for creating a new therapy room
 */
export class CreateTherapyRoomDto {
  @ApiProperty({ example: 'Sensory Integration Room', description: 'Name of the therapy room' })
  @IsString()
  @IsNotEmpty({ message: 'Room name is required' })
  name!: string;

  @ApiPropertyOptional({ example: 4, description: 'Maximum capacity of the room' })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ 
    example: 'Specialized room for sensory integration therapy with controlled lighting and soundproofing', 
    description: 'Description of the room and its features'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    example: 'Swings, balance beams, tactile boards, sound system', 
    description: 'List of permanent equipment available in the room'
  })
  @IsString()
  @IsOptional()
  equipment?: string;

  @ApiPropertyOptional({ 
    default: true, 
    example: true, 
    description: 'Whether the room is currently active and available for scheduling'
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
