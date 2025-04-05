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
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto, AssessmentType } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
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
 * Controller handling assessment-related endpoints
 */
@ApiTags('assessments')
@Controller('assessments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  /**
   * Create a new assessment
   */
  @Post()
  @ApiOperation({ summary: 'Create a new assessment' })
  @ApiResponse({ status: 201, description: 'Assessment successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client or learner not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async create(
    @Body() createAssessmentDto: CreateAssessmentDto, 
    @Request() req: RequestWithUser
  ) {
    return this.assessmentService.create(
      createAssessmentDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Get all assessments with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all assessments with optional filtering' })
  @ApiQuery({ 
    name: 'clientId', 
    required: false, 
    description: 'Filter by client ID' 
  })
  @ApiQuery({ 
    name: 'learnerId', 
    required: false, 
    description: 'Filter by learner ID' 
  })
  @ApiQuery({ 
    name: 'assessmentType', 
    required: false, 
    description: 'Filter by assessment type',
    enum: AssessmentType
  })
  @ApiResponse({ status: 200, description: 'Returns a list of assessments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('clientId') clientId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('assessmentType') assessmentType?: AssessmentType,
  ) {
    return this.assessmentService.findAll(clientId, learnerId, assessmentType);
  }

  /**
   * Get assessment by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get assessment by ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Returns the assessment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async findOne(@Param('id', ParseIntPipe) id: string) {
    return this.assessmentService.findOne(BigInt(id));
  }

  /**
   * Update an assessment
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @Request() req: RequestWithUser
  ) {
    return this.assessmentService.update(
      BigInt(id), 
      updateAssessmentDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Delete an assessment
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: string) {
    return this.assessmentService.remove(BigInt(id));
  }
}
