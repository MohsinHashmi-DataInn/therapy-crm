import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth, 
  ApiQuery 
} from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Define UserRole enum locally to match what's in the Prisma schema
enum UserRole {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST',
  STAFF = 'STAFF'
}

/**
 * Controller handling waitlist-related endpoints
 */
@ApiTags('waitlist')
@Controller('waitlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  /**
   * Create a new waitlist entry
   */
  @Post()
  @ApiOperation({ summary: 'Create a new waitlist entry' })
  @ApiResponse({ status: 201, description: 'Waitlist entry successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async create(@Body() createWaitlistDto: CreateWaitlistDto, @Request() req: any) {
    return this.waitlistService.create(createWaitlistDto, req.user.id);
  }

  /**
   * Get all waitlist entries with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all waitlist entries with optional filtering' })
  @ApiQuery({ name: 'serviceType', required: false, description: 'Filter by service type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by waitlist status' })
  @ApiResponse({ status: 200, description: 'Returns all waitlist entries matching the filters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('serviceType') serviceType?: string,
    @Query('status') status?: string,
  ) {
    return this.waitlistService.findAll(serviceType, status);
  }

  /**
   * Get waitlist entry by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get waitlist entry by ID' })
  @ApiParam({ name: 'id', description: 'Waitlist entry ID' })
  @ApiResponse({ status: 200, description: 'Returns the waitlist entry' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Waitlist entry not found' })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.waitlistService.findOne(BigInt(id));
  }

  /**
   * Update waitlist entry by ID
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update waitlist entry by ID' })
  @ApiParam({ name: 'id', description: 'Waitlist entry ID' })
  @ApiResponse({ status: 200, description: 'Waitlist entry successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Waitlist entry or client not found' })
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateWaitlistDto: UpdateWaitlistDto,
    @Request() req: any,
  ) {
    return this.waitlistService.update(BigInt(id), updateWaitlistDto, req.user.id);
  }

  /**
   * Delete waitlist entry by ID (Admin or Staff only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete waitlist entry by ID (Admin or Staff only)' })
  @ApiParam({ name: 'id', description: 'Waitlist entry ID' })
  @ApiResponse({ status: 200, description: 'Waitlist entry successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  @ApiResponse({ status: 404, description: 'Waitlist entry not found' })
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.waitlistService.remove(BigInt(id));
  }
}
