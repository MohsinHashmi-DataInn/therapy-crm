import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({ description: 'ID of the user to add as a participant' })
  @IsNotEmpty()
  @IsString()
  user_id!: string;

  @ApiPropertyOptional({ description: 'URL for the participant to join the session' })
  @IsOptional()
  @IsString()
  join_url?: string;

  @ApiPropertyOptional({ 
    description: 'Role of the participant in the session',
    enum: ['HOST', 'CO_HOST', 'ATTENDEE', 'OBSERVER'],
    default: 'ATTENDEE'
  })
  @IsOptional()
  @IsEnum(['HOST', 'CO_HOST', 'ATTENDEE', 'OBSERVER'])
  participant_role?: string;
}
