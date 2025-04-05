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
  ApiQuery,
  ApiBody 
} from '@nestjs/swagger';
import { TreatmentPlanService } from './treatment-plan.service';
import { CreateTreatmentPlanDto, PlanStatus, ApprovalStatus } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
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
 * Controller handling treatment plan-related endpoints
 */
@ApiTags('treatment-plans')
@Controller('treatment-plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TreatmentPlanController {
  constructor(private readonly treatmentPlanService: TreatmentPlanService) {}

  /**
   * Create a new treatment plan
   */
  @Post()
  @ApiOperation({ summary: 'Create a new treatment plan' })
  @ApiResponse({ status: 201, description: 'Treatment plan successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client or learner not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async create(
    @Body() createTreatmentPlanDto: CreateTreatmentPlanDto, 
    @Request() req: RequestWithUser
  ) {
    return this.treatmentPlanService.create(
      createTreatmentPlanDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Get all treatment plans with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all treatment plans with optional filtering' })
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
    name: 'status', 
    required: false, 
    description: 'Filter by status',
    enum: PlanStatus
  })
  @ApiQuery({ 
    name: 'approvalStatus', 
    required: false, 
    description: 'Filter by approval status',
    enum: ApprovalStatus
  })
  @ApiResponse({ status: 200, description: 'Returns a list of treatment plans' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('clientId') clientId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('status') status?: PlanStatus,
    @Query('approvalStatus') approvalStatus?: ApprovalStatus,
  ) {
    return this.treatmentPlanService.findAll(clientId, learnerId, status, approvalStatus);
  }

  /**
   * Get treatment plan by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get treatment plan by ID' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 200, description: 'Returns the treatment plan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  async findOne(@Param('id', ParseIntPipe) id: string) {
    return this.treatmentPlanService.findOne(BigInt(id));
  }

  /**
   * Update a treatment plan
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a treatment plan' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 200, description: 'Treatment plan successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateTreatmentPlanDto: UpdateTreatmentPlanDto,
    @Request() req: RequestWithUser
  ) {
    return this.treatmentPlanService.update(
      BigInt(id), 
      updateTreatmentPlanDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Delete a treatment plan
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a treatment plan' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 200, description: 'Treatment plan successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: string) {
    return this.treatmentPlanService.remove(BigInt(id));
  }

  /**
   * Add a goal to a treatment plan
   */
  @Post(':id/goals')
  @ApiOperation({ summary: 'Add a goal to a treatment plan' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 201, description: 'Goal successfully added' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async addGoal(
    @Param('id', ParseIntPipe) id: string,
    @Body() createGoalDto: CreateGoalDto,
    @Request() req: RequestWithUser
  ) {
    return this.treatmentPlanService.addGoal(
      BigInt(id), 
      createGoalDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Update a goal
   */
  @Patch('goals/:id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiResponse({ status: 200, description: 'Goal successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async updateGoal(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @Request() req: RequestWithUser
  ) {
    return this.treatmentPlanService.updateGoal(
      BigInt(id), 
      updateGoalDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Delete a goal
   */
  @Delete('goals/:id')
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiResponse({ status: 200, description: 'Goal successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async removeGoal(@Param('id', ParseIntPipe) id: string) {
    return this.treatmentPlanService.removeGoal(BigInt(id));
  }

  /**
   * Add an intervention to a treatment plan
   */
  @Post(':id/interventions')
  @ApiOperation({ summary: 'Add an intervention to a treatment plan' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 201, description: 'Intervention successfully added' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async addIntervention(
    @Param('id', ParseIntPipe) id: string,
    @Body() createInterventionDto: CreateInterventionDto,
    @Request() req: RequestWithUser
  ) {
    return this.treatmentPlanService.addIntervention(
      BigInt(id), 
      createInterventionDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Update an intervention
   */
  @Patch('interventions/:id')
  @ApiOperation({ summary: 'Update an intervention' })
  @ApiParam({ name: 'id', description: 'Intervention ID' })
  @ApiResponse({ status: 200, description: 'Intervention successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Intervention not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async updateIntervention(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateInterventionDto: UpdateInterventionDto,
    @Request() req: RequestWithUser
  ) {
    return this.treatmentPlanService.updateIntervention(
      BigInt(id), 
      updateInterventionDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Delete an intervention
   */
  @Delete('interventions/:id')
  @ApiOperation({ summary: 'Delete an intervention' })
  @ApiParam({ name: 'id', description: 'Intervention ID' })
  @ApiResponse({ status: 200, description: 'Intervention successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Intervention not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async removeIntervention(@Param('id', ParseIntPipe) id: string) {
    return this.treatmentPlanService.removeIntervention(BigInt(id));
  }

  /**
   * Update treatment plan status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update treatment plan status' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(PlanStatus),
          example: PlanStatus.ACTIVE,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: string,
    @Body('status') status: PlanStatus,
    @Request() req: RequestWithUser
  ) {
    return this.treatmentPlanService.updateStatus(
      BigInt(id), 
      status, 
      BigInt(req.user.id)
    );
  }

  /**
   * Update treatment plan approval status
   */
  @Patch(':id/approval')
  @ApiOperation({ summary: 'Update treatment plan approval status' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approvalStatus: {
          type: 'string',
          enum: Object.values(ApprovalStatus),
          example: ApprovalStatus.APPROVED,
        },
        approvalNotes: {
          type: 'string',
          example: 'Approved with minor revisions',
        },
      },
      required: ['approvalStatus'],
    },
  })
  @ApiResponse({ status: 200, description: 'Approval status successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateApprovalStatus(
    @Param('id', ParseIntPipe) id: string,
    @Body('approvalStatus') approvalStatus: ApprovalStatus,
    @Body('approvalNotes') approvalNotes: string,
    @Request() req: RequestWithUser
  ) {
    return this.treatmentPlanService.updateApprovalStatus(
      BigInt(id), 
      approvalStatus, 
      approvalNotes,
      BigInt(req.user.id)
    );
  }
}
