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
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth, 
  ApiQuery 
} from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';

// Define request interface
interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Controller handling communication-related endpoints
 */
@ApiTags('communications')
@Controller('communications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  /**
   * Create a new communication
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new communication' })
  @ApiResponse({ status: 201, description: 'Communication successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client, learner, or appointment not found' })
  async create(@Body() createCommunicationDto: CreateCommunicationDto, @Request() req: RequestWithUser) {
    try {
      return await this.communicationService.create(createCommunicationDto, BigInt(req.user.id));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error && error.message.includes('Invalid ID format')) {
        throw new BadRequestException(error.message);
      } else if (error instanceof Error && error.message.includes('validation failed')) {
        throw new BadRequestException(error.message);
      } else {
        throw new InternalServerErrorException('Failed to create communication');
      }
    }
  }

  /**
   * Get all communications with optional filtering
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all communications with optional filtering' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'learnerId', required: false, description: 'Filter by learner ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by communication type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Returns all communications matching the filters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(
    @Query('clientId') clientId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      return await this.communicationService.findAll(clientId, learnerId, type);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to retrieve communications');
      }
    }
  }

  /**
   * Get all communications for a specific client
   */
  @Get('client/:clientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all communications for a specific client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Returns all communications for the client' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByClient(@Param('clientId') clientId: string) {
    try {
      const communications = await this.communicationService.findAll(clientId);
      if (!communications || communications.length === 0) {
        // Return empty array instead of 404 to be consistent with API patterns
        return [];
      }
      return communications;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to retrieve communications for client');
      }
    }
  }

  /**
   * Get communication by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get communication by ID' })
  @ApiParam({ name: 'id', description: 'Communication ID' })
  @ApiResponse({ status: 200, description: 'Returns the communication' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.communicationService.findOne(BigInt(id));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error && error.message.includes('BigInt')) {
        throw new BadRequestException(`Invalid ID format: ${id}`);
      } else if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Communication with ID ${id} not found`);
      } else {
        throw new InternalServerErrorException('Failed to retrieve communication');
      }
    }
  }

  /**
   * Update a communication
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a communication' })
  @ApiParam({ name: 'id', description: 'Communication ID' })
  @ApiResponse({ status: 200, description: 'Communication successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCommunicationDto: UpdateCommunicationDto,
    @Request() req: RequestWithUser
  ) {
    try {
      // First check if the communication exists
      try {
        await this.communicationService.findOne(BigInt(id));
      } catch (err) {
        if (err instanceof NotFoundException) {
          throw err;
        }
      }
      
      return await this.communicationService.update(
        BigInt(id),
        updateCommunicationDto,
        BigInt(req.user.id)
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error && error.message.includes('Invalid ID format')) {
        throw new BadRequestException(error.message);
      } else if (error instanceof Error && error.message.includes('validation failed')) {
        throw new BadRequestException(error.message);
      } else if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Communication with ID ${id} not found`);
      } else {
        throw new InternalServerErrorException('Failed to update communication');
      }
    }
  }

  /**
   * Delete a communication
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a communication' })
  @ApiParam({ name: 'id', description: 'Communication ID' })
  @ApiResponse({ status: 204, description: 'Communication successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    try {
      // Explicitly check if communication exists before attempting to delete
      try {
        await this.communicationService.findOne(BigInt(id));
      } catch (err) {
        if (err instanceof NotFoundException) {
          throw new NotFoundException(`Communication with ID ${id} not found`);
        }
      }
      
      await this.communicationService.remove(BigInt(id));
      // For DELETE operations with success, return nothing (void) with 204 status
      return;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ForbiddenException) {
        throw error;
      } else if (error instanceof Error && error.message.includes('BigInt')) {
        throw new BadRequestException(`Invalid ID format: ${id}`);
      } else if (error instanceof Error && (error.message.includes('Record to delete does not exist') || error.message.includes('not found'))) {
        throw new NotFoundException(`Communication with ID ${id} not found`);
      } else {
        console.error('Delete communication error:', error);
        throw new InternalServerErrorException('Failed to delete communication');
      }
    }
  }
}
