import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data transfer object for generating a join link for a participant
 */
export class GenerateJoinLinkDto {
  @ApiProperty({ 
    description: 'Email of the participant to generate join link for',
    example: 'participant@example.com'
  })
  @IsNotEmpty()
  @IsEmail()
  participantEmail!: string;
}
