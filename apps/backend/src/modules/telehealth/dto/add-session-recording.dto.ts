import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsDateString,
  IsEnum
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum for recording types
 */
export enum RecordingType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  SCREEN_SHARE = 'SCREEN_SHARE',
  TRANSCRIPT = 'TRANSCRIPT'
}

/**
 * Data transfer object for adding a recording to a virtual session
 */
export class AddSessionRecordingDto {
  @ApiProperty({ 
    description: 'URL of the recording file or stream',
    example: 'https://provider.com/recordings/session-123.mp4'
  })
  @IsNotEmpty()
  @IsString()
  recordingUrl!: string;

  @ApiProperty({ 
    description: 'Type of recording',
    enum: RecordingType,
    example: RecordingType.VIDEO
  })
  @IsNotEmpty()
  @IsEnum(RecordingType)
  recordingType!: string;

  @ApiProperty({ 
    description: 'Start time of the recording',
    example: '2025-04-15T14:30:00Z'
  })
  @IsNotEmpty()
  @IsDateString()
  startTime!: string;

  @ApiProperty({ 
    description: 'End time of the recording (if available)',
    required: false,
    example: '2025-04-15T15:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ 
    description: 'Duration of the recording in minutes',
    required: false,
    example: 60
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiProperty({ 
    description: 'File size in bytes',
    required: false,
    example: 104857600 // 100MB
  })
  @IsOptional()
  @IsNumber()
  fileSizeBytes?: number;
}
