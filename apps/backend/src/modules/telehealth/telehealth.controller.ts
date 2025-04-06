import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  Logger,
  NotFoundException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { TelehealthService } from './telehealth.service';
import { CreateVirtualSessionDto } from './dto/create-virtual-session.dto';
import { AddSessionRecordingDto } from './dto/add-session-recording.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { GenerateJoinLinkDto } from './dto/generate-join-link.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';

/**
 * Controller for managing telehealth virtual sessions
 */
@ApiTags('telehealth')
@Controller('telehealth')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TelehealthController {
  private readonly logger = new Logger(TelehealthController.name);
  constructor(private readonly telehealthService: TelehealthService) {}

  /**
   * Create a new virtual session for an appointment
   */
  @Post('sessions')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Create a new virtual telehealth session' })
  @ApiResponse({ status: 201, description: 'Virtual session created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Appointment or provider not found' })
  async createVirtualSession(
    @Body() createVirtualSessionDto: CreateVirtualSessionDto,
    @GetUser('id') userId: number,
  ) {
    return this.telehealthService.createVirtualSession(
      createVirtualSessionDto,
      BigInt(userId),
    );
  }

  /**
   * Get a virtual session by ID
   */
  @Get('sessions/:id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get virtual session details by ID' })
  @ApiParam({ name: 'id', description: 'Virtual session ID' })
  @ApiResponse({ status: 200, description: 'Returns the virtual session details' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Virtual session not found' })
  async getVirtualSession(@Param('id', ParseIntPipe) id: number) {
    return this.telehealthService.getVirtualSessionById(id);
  }

  /**
   * List all virtual sessions with optional filtering
   */
  @Get('sessions')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'List virtual sessions with optional filtering' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filter by provider ID' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter by start date (from)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter by start date (to)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of virtual sessions' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listVirtualSessions(
    @Query() queryParams: {
      status?: string;
      providerId?: number;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.telehealthService.listVirtualSessions(queryParams);
  }

  /**
   * Update a virtual session's status
   */
  @Put('sessions/:id/status')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Update a virtual session status' })
  @ApiParam({ name: 'id', description: 'Virtual session ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Virtual session not found' })
  async updateSessionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateSessionStatusDto,
    @GetUser('id') userId: number,
  ) {
    try {
      return await this.telehealthService.updateSessionStatus(
        id,
        updateStatusDto.status,
        BigInt(userId),
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update session status: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Add a recording to a virtual session
   */
  @Post('sessions/:id/recordings')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Add a recording to a virtual session' })
  @ApiParam({ name: 'id', description: 'Virtual session ID' })
  @ApiResponse({ status: 201, description: 'Recording added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Virtual session not found' })
  async addSessionRecording(
    @Param('id', ParseIntPipe) id: number,
    @Body() recordingData: AddSessionRecordingDto,
    @GetUser('id') userId: number,
  ) {
    try {
      return await this.telehealthService.addSessionRecording(
        id,
        recordingData,
        BigInt(userId),
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add session recording: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate a join link for a participant
   */
  @Post('sessions/:id/join')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Generate a join link for a participant' })
  @ApiParam({ name: 'id', description: 'Virtual session ID' })
  @ApiResponse({ status: 200, description: 'Join link generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Virtual session not found' })
  async generateJoinLink(
    @Param('id', ParseIntPipe) id: number,
    @Body() joinLinkDto: GenerateJoinLinkDto,
  ) {
    try {
      return await this.telehealthService.generateParticipantJoinLink(
        id,
        joinLinkDto.participantEmail,
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to generate join link: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get available telehealth providers
   */
  @Get('providers')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get list of available telehealth providers' })
  @ApiResponse({ status: 200, description: 'Returns list of providers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getProviders() {
    const providers = await this.telehealthService['prismaService'].telehealth_providers.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        description: true,
        supports_recording: true,
        supports_screen_sharing: true,
        supports_waiting_room: true,
        max_participants: true,
      },
    });
    
    return providers;
  }
}
