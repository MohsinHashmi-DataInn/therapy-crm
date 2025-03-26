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
  @ApiOperation({ summary: 'Create a new communication' })
  @ApiResponse({ status: 201, description: 'Communication successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client, learner, or appointment not found' })
  async create(@Body() createCommunicationDto: CreateCommunicationDto, @Request() req: RequestWithUser) {
    return this.communicationService.create(createCommunicationDto, BigInt(req.user.id));
  }

  /**
   * Get all communications with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all communications with optional filtering' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'learnerId', required: false, description: 'Filter by learner ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by communication type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Returns all communications matching the filters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('clientId') clientId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.communicationService.findAll(clientId, learnerId, type);
  }

  /**
   * Get communication by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get communication by ID' })
  @ApiParam({ name: 'id', description: 'Communication ID' })
  @ApiResponse({ status: 200, description: 'Returns the communication' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  findOne(@Param('id') id: string) {
    return this.communicationService.findOne(BigInt(id));
  }

  /**
   * Update a communication
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a communication' })
  @ApiParam({ name: 'id', description: 'Communication ID' })
  @ApiResponse({ status: 200, description: 'Communication successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  update(
    @Param('id') id: string,
    @Body() updateCommunicationDto: UpdateCommunicationDto,
    @Request() req: RequestWithUser
  ) {
    return this.communicationService.update(
      BigInt(id),
      updateCommunicationDto,
      BigInt(req.user.id)
    );
  }

  /**
   * Delete a communication
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a communication' })
  @ApiParam({ name: 'id', description: 'Communication ID' })
  @ApiResponse({ status: 200, description: 'Communication successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  remove(@Param('id') id: string) {
    return this.communicationService.remove(BigInt(id));
  }
}
