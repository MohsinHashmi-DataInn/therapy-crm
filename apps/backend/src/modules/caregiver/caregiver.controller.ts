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
import { CaregiverService } from './caregiver.service';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { UpdateCaregiverDto } from './dto/update-caregiver.dto';
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
 * Controller handling caregiver-related endpoints
 */
@ApiTags('caregivers')
@Controller('caregivers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CaregiverController {
  constructor(private readonly caregiverService: CaregiverService) {}

  /**
   * Create a new caregiver
   */
  @Post()
  @ApiOperation({ summary: 'Create a new caregiver' })
  @ApiResponse({ status: 201, description: 'Caregiver successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async create(
    @Body() createCaregiverDto: CreateCaregiverDto, 
    @Request() req: RequestWithUser
  ) {
    return this.caregiverService.create(
      createCaregiverDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Get all caregivers for a client
   */
  @Get()
  @ApiOperation({ summary: 'Get all caregivers for a client' })
  @ApiQuery({ 
    name: 'clientId', 
    required: true, 
    description: 'Client ID to get caregivers for' 
  })
  @ApiResponse({ status: 200, description: 'Returns all caregivers for the client' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllByClient(@Query('clientId', ParseIntPipe) clientId: string) {
    return this.caregiverService.findAllByClient(BigInt(clientId));
  }

  /**
   * Get caregiver by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get caregiver by ID' })
  @ApiParam({ name: 'id', description: 'Caregiver ID' })
  @ApiResponse({ status: 200, description: 'Returns the caregiver' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Caregiver not found' })
  async findOne(@Param('id', ParseIntPipe) id: string) {
    return this.caregiverService.findOne(BigInt(id));
  }

  /**
   * Update a caregiver
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a caregiver' })
  @ApiParam({ name: 'id', description: 'Caregiver ID' })
  @ApiResponse({ status: 200, description: 'Caregiver successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Caregiver not found' })
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateCaregiverDto: UpdateCaregiverDto,
    @Request() req: RequestWithUser
  ) {
    return this.caregiverService.update(
      BigInt(id), 
      updateCaregiverDto, 
      BigInt(req.user.id)
    );
  }

  /**
   * Delete a caregiver
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a caregiver' })
  @ApiParam({ name: 'id', description: 'Caregiver ID' })
  @ApiResponse({ status: 200, description: 'Caregiver successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Caregiver not found' })
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @UseGuards(RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: string) {
    return this.caregiverService.remove(BigInt(id));
  }
}
