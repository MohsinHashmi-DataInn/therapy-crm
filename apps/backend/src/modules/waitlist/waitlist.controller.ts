import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistEntryDto, UpdateWaitlistEntryDto } from './dto/waitlist.dto';
import { WaitlistPriority, WaitlistStatus } from '@prisma/client';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new waitlist entry' })
  @ApiResponse({ status: 201, description: 'Waitlist entry successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createWaitlistEntryDto: CreateWaitlistEntryDto) {
    return this.waitlistService.create(createWaitlistEntryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all waitlist entries with optional filtering' })
  @ApiResponse({ status: 200, description: 'Return all waitlist entries' })
  async findAll(
    @Query('priority') priority?: WaitlistPriority,
    @Query('status') status?: WaitlistStatus,
    @Query('clientId') clientId?: string,
    @Query('followUpFrom') followUpFrom?: string,
    @Query('followUpTo') followUpTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.waitlistService.findAll({
      priority,
      status,
      clientId,
      followUpFrom,
      followUpTo,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a waitlist entry by id' })
  @ApiResponse({ status: 200, description: 'Return the waitlist entry' })
  @ApiResponse({ status: 404, description: 'Waitlist entry not found' })
  async findOne(@Param('id') id: string) {
    return this.waitlistService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a waitlist entry' })
  @ApiResponse({ status: 200, description: 'Waitlist entry successfully updated' })
  @ApiResponse({ status: 404, description: 'Waitlist entry not found' })
  async update(@Param('id') id: string, @Body() updateWaitlistEntryDto: UpdateWaitlistEntryDto) {
    return this.waitlistService.update(id, updateWaitlistEntryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a waitlist entry' })
  @ApiResponse({ status: 200, description: 'Waitlist entry successfully deleted' })
  @ApiResponse({ status: 404, description: 'Waitlist entry not found' })
  async remove(@Param('id') id: string) {
    return this.waitlistService.remove(id);
  }

  @Get('due-follow-ups')
  @ApiOperation({ summary: 'Get waitlist entries with follow-ups due today or overdue' })
  @ApiResponse({ status: 200, description: 'Return waitlist entries with due follow-ups' })
  async getDueFollowUps() {
    return this.waitlistService.getDueFollowUps();
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all waitlist entries for a specific client' })
  @ApiResponse({ status: 200, description: 'Return all waitlist entries for the client' })
  async findByClient(@Param('clientId') clientId: string) {
    return this.waitlistService.findByClient(clientId);
  }
}
