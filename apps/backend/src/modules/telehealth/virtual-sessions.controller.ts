import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { VirtualSessionsService } from './virtual-sessions.service';
import { CreateVirtualSessionDto } from './dto/create-virtual-session.dto';
import { UpdateVirtualSessionDto } from './dto/update-virtual-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddParticipantDto } from './dto/add-participant.dto';

@ApiTags('virtual-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('virtual-sessions')
export class VirtualSessionsController {
  constructor(private readonly virtualSessionsService: VirtualSessionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Create a new virtual session' })
  @ApiResponse({ status: 201, description: 'The virtual session has been successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(
    @Body() createVirtualSessionDto: CreateVirtualSessionDto,
    @CurrentUser() user: any,
  ) {
    return this.virtualSessionsService.create(
      createVirtualSessionDto,
      BigInt(user.id),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all virtual sessions' })
  @ApiResponse({ status: 200, description: 'Return all virtual sessions.' })
  findAll(
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('therapistId') therapistId?: string,
    @Query('clientId') clientId?: string,
  ) {
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (from) {
      filters.from = new Date(from);
    }
    
    if (to) {
      filters.to = new Date(to);
    }
    
    if (therapistId) {
      filters.therapistId = BigInt(therapistId);
    }
    
    if (clientId) {
      filters.clientId = BigInt(clientId);
    }
    
    return this.virtualSessionsService.findAll(filters);
  }
  
  @Get('my-sessions')
  @ApiOperation({ summary: 'Get sessions for the current user' })
  @ApiResponse({ status: 200, description: 'Return all virtual sessions for the current user.' })
  findMySessionsAsTherapist(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const filters: any = {
      therapistId: BigInt(user.id),
    };
    
    if (status) {
      filters.status = status;
    }
    
    if (from) {
      filters.from = new Date(from);
    }
    
    if (to) {
      filters.to = new Date(to);
    }
    
    return this.virtualSessionsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a virtual session by id' })
  @ApiResponse({ status: 200, description: 'Return a virtual session by id.' })
  @ApiResponse({ status: 404, description: 'Virtual session not found.' })
  findOne(@Param('id') id: string) {
    return this.virtualSessionsService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Update a virtual session' })
  @ApiResponse({ status: 200, description: 'The virtual session has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Virtual session not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(
    @Param('id') id: string,
    @Body() updateVirtualSessionDto: UpdateVirtualSessionDto,
    @CurrentUser() user: any,
  ) {
    // Check if user is allowed to update this session
    const session = await this.virtualSessionsService.findOne(BigInt(id));
    
    const isAdmin = user.role === UserRole.ADMIN;
    const isTherapistForSession = session.therapist_id.toString() === user.id.toString();
    
    if (!isAdmin && !isTherapistForSession) {
      throw new ForbiddenException('You are not authorized to update this session');
    }
    
    return this.virtualSessionsService.update(BigInt(id), updateVirtualSessionDto, BigInt(user.id));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Delete a virtual session' })
  @ApiResponse({ status: 200, description: 'The virtual session has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Virtual session not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    // Check if user is allowed to delete this session
    const session = await this.virtualSessionsService.findOne(BigInt(id));
    
    const isAdmin = user.role === UserRole.ADMIN;
    const isTherapistForSession = session.therapist_id.toString() === user.id.toString();
    
    if (!isAdmin && !isTherapistForSession) {
      throw new ForbiddenException('You are not authorized to delete this session');
    }
    
    return this.virtualSessionsService.remove(BigInt(id));
  }

  @Post(':id/start')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Start a virtual session' })
  @ApiResponse({ status: 200, description: 'The virtual session has been successfully started.' })
  @ApiResponse({ status: 404, description: 'Virtual session not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async startSession(@Param('id') id: string, @CurrentUser() user: any) {
    // Check if user is allowed to start this session
    const session = await this.virtualSessionsService.findOne(BigInt(id));
    
    const isAdmin = user.role === UserRole.ADMIN;
    const isTherapistForSession = session.therapist_id.toString() === user.id.toString();
    
    if (!isAdmin && !isTherapistForSession) {
      throw new ForbiddenException('You are not authorized to start this session');
    }
    
    return this.virtualSessionsService.startSession(BigInt(id));
  }

  @Post(':id/end')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'End a virtual session' })
  @ApiResponse({ status: 200, description: 'The virtual session has been successfully ended.' })
  @ApiResponse({ status: 404, description: 'Virtual session not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async endSession(@Param('id') id: string, @CurrentUser() user: any) {
    // Check if user is allowed to end this session
    const session = await this.virtualSessionsService.findOne(BigInt(id));
    
    const isAdmin = user.role === UserRole.ADMIN;
    const isTherapistForSession = session.therapist_id.toString() === user.id.toString();
    
    if (!isAdmin && !isTherapistForSession) {
      throw new ForbiddenException('You are not authorized to end this session');
    }
    
    return this.virtualSessionsService.endSession(BigInt(id));
  }

  @Post(':id/participants')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Add a participant to a virtual session' })
  @ApiResponse({ status: 201, description: 'The participant has been successfully added.' })
  @ApiResponse({ status: 404, description: 'Virtual session not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async addParticipant(
    @Param('id') id: string,
    @Body() addParticipantDto: AddParticipantDto,
    @CurrentUser() user: any,
  ) {
    // Check if user is allowed to add participants to this session
    const session = await this.virtualSessionsService.findOne(BigInt(id));
    
    const isAdmin = user.role === UserRole.ADMIN;
    const isTherapistForSession = session.therapist_id.toString() === user.id.toString();
    
    if (!isAdmin && !isTherapistForSession) {
      throw new ForbiddenException('You are not authorized to add participants to this session');
    }
    
    return this.virtualSessionsService.addParticipant(BigInt(id), addParticipantDto);
  }

  @Delete(':id/participants/:participantId')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Remove a participant from a virtual session' })
  @ApiResponse({ status: 200, description: 'The participant has been successfully removed.' })
  @ApiResponse({ status: 404, description: 'Participant not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @CurrentUser() user: any,
  ) {
    // Check if user is allowed to remove participants from this session
    const session = await this.virtualSessionsService.findOne(BigInt(id));
    
    const isAdmin = user.role === UserRole.ADMIN;
    const isTherapistForSession = session.therapist_id.toString() === user.id.toString();
    
    if (!isAdmin && !isTherapistForSession) {
      throw new ForbiddenException('You are not authorized to remove participants from this session');
    }
    
    return this.virtualSessionsService.removeParticipant(BigInt(id), BigInt(participantId));
  }

  @Post(':id/recordings')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Add a recording to a virtual session' })
  @ApiResponse({ status: 201, description: 'The recording has been successfully added.' })
  @ApiResponse({ status: 404, description: 'Virtual session not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async addRecording(
    @Param('id') id: string,
    @Body('recording_url') recordingUrl: string,
    @Body('recording_type') recordingType: string,
    @CurrentUser() user: any,
  ) {
    // Check if user is allowed to add recordings to this session
    const session = await this.virtualSessionsService.findOne(BigInt(id));
    
    const isAdmin = user.role === UserRole.ADMIN;
    const isTherapistForSession = session.therapist_id.toString() === user.id.toString();
    
    if (!isAdmin && !isTherapistForSession) {
      throw new ForbiddenException('You are not authorized to add recordings to this session');
    }
    
    return this.virtualSessionsService.addRecording(
      BigInt(id),
      recordingUrl,
      recordingType,
      BigInt(user.id),
    );
  }

  @Get(':id/join')
  @ApiOperation({ summary: 'Get join information for a virtual session' })
  @ApiResponse({ status: 200, description: 'Return join information for the session.' })
  @ApiResponse({ status: 404, description: 'Virtual session not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getJoinInfo(@Param('id') id: string, @CurrentUser() user: any) {
    return this.virtualSessionsService.getJoinInfo(BigInt(id), BigInt(user.id));
  }
}
