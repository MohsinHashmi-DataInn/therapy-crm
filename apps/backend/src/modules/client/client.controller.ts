// Define UserRole enum locally to match what's in the Prisma schema
enum UserRole {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST',
  STAFF = 'STAFF'
}

// Define request interface
interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

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
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Controller handling client-related endpoints
 */
@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  /**
   * Create a new client
   */
  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Client with this email already exists' })
  async create(@Body() createClientDto: CreateClientDto, @Request() req: RequestWithUser) {
    return this.clientService.create(createClientDto, BigInt(req.user.id));
  }

  /**
   * Get all clients with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all clients with optional filtering' })
  @ApiQuery({ name: 'therapistId', required: false, description: 'Filter by therapist ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by client status' })
  @ApiResponse({ status: 200, description: 'Returns all clients matching the filters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('therapistId') therapistId?: string,
    @Query('status') status?: string,
    @Request() req?: RequestWithUser,
  ) {
    // If user is not an admin or staff, only show their own clients
    if (req?.user.role === UserRole.THERAPIST) {
      therapistId = req.user.id;
    }
    
    return this.clientService.findAll(therapistId, status);
  }

  /**
   * Get client by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Returns the client' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findOne(@Param('id', ParseIntPipe) id: string) {
    return this.clientService.findOne(BigInt(id));
  }

  /**
   * Update client by ID
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update client by ID' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Client successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 409, description: 'Email already in use by another client' })
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req: RequestWithUser,
  ) {
    return this.clientService.update(BigInt(id), updateClientDto, BigInt(req.user.id));
  }

  /**
   * Delete client by ID (Admin or Staff only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete client by ID (Admin or Staff only)' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Client successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async remove(@Param('id', ParseIntPipe) id: string) {
    return this.clientService.remove(BigInt(id));
  }
}
