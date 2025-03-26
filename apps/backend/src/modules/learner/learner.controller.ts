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
import { LearnerService } from './learner.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
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
 * Controller handling learner-related endpoints
 */
@ApiTags('learners')
@Controller('learners')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  /**
   * Create a new learner
   */
  @Post()
  @ApiOperation({ summary: 'Create a new learner' })
  @ApiResponse({ status: 201, description: 'Learner successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async create(@Body() createLearnerDto: CreateLearnerDto, @Request() req: RequestWithUser) {
    return this.learnerService.create(createLearnerDto, BigInt(req.user.id));
  }

  /**
   * Get all learners with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all learners with optional filtering' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by learner status' })
  @ApiResponse({ status: 200, description: 'Returns all learners matching the filters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Request() req: RequestWithUser,
    @Query('clientId') clientId?: string,
    @Query('instructorId') instructorId?: string,
    @Query('status') status?: string,
  ) {
    // If user is therapist, only show their assigned learners
    if (req.user.role === UserRole.THERAPIST) {
      instructorId = req.user.id;
    }
    
    return this.learnerService.findAll(clientId, instructorId, status);
  }

  /**
   * Get learner by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get learner by ID' })
  @ApiParam({ name: 'id', description: 'Learner ID' })
  @ApiResponse({ status: 200, description: 'Returns the learner' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async findOne(@Param('id') id: string) {
    return this.learnerService.findOne(BigInt(id));
  }

  /**
   * Update learner by ID
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update learner by ID' })
  @ApiParam({ name: 'id', description: 'Learner ID' })
  @ApiResponse({ status: 200, description: 'Learner successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLearnerDto: UpdateLearnerDto,
    @Request() req: RequestWithUser,
  ) {
    return this.learnerService.update(BigInt(id), updateLearnerDto, BigInt(req.user.id));
  }

  /**
   * Delete learner by ID (Admin or Staff only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete learner by ID (Admin or Staff only)' })
  @ApiParam({ name: 'id', description: 'Learner ID' })
  @ApiResponse({ status: 200, description: 'Learner successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin or staff role' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async remove(@Param('id') id: string) {
    return this.learnerService.remove(BigInt(id));
  }
}
