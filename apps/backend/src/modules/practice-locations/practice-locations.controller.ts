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
  ParseBoolPipe,
  DefaultValuePipe,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { PracticeLocationsService } from './practice-locations.service';
import { CreatePracticeLocationDto } from './dto/create-practice-location.dto';
import { UpdatePracticeLocationDto } from './dto/update-practice-location.dto';

/**
 * Controller for managing practice locations
 */
@ApiTags('practice-locations')
@Controller('practice-locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PracticeLocationsController {
  constructor(private readonly practiceLocationsService: PracticeLocationsService) {}

  /**
   * Create a new practice location
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new practice location' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The practice location has been successfully created' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden - Requires admin or manager role' 
  })
  async create(
    @Body() createPracticeLocationDto: CreatePracticeLocationDto,
    @Request() req,
  ) {
    return this.practiceLocationsService.create(
      createPracticeLocationDto,
      BigInt(req.user.id),
    );
  }

  /**
   * Get all practice locations
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all practice locations' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Whether to include inactive locations',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all practice locations' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  async findAll(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive: boolean,
  ) {
    return this.practiceLocationsService.findAll(includeInactive);
  }

  /**
   * Get a specific practice location by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get a specific practice location by ID' })
  @ApiParam({ name: 'id', description: 'Practice location ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns the practice location' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Practice location not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  async findOne(@Param('id') id: string) {
    return this.practiceLocationsService.findOne(BigInt(id));
  }

  /**
   * Update a practice location
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a practice location' })
  @ApiParam({ name: 'id', description: 'Practice location ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The practice location has been successfully updated' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Practice location not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden - Requires admin or manager role' 
  })
  async update(
    @Param('id') id: string,
    @Body() updatePracticeLocationDto: UpdatePracticeLocationDto,
    @Request() req,
  ) {
    return this.practiceLocationsService.update(
      BigInt(id),
      updatePracticeLocationDto,
      BigInt(req.user.id),
    );
  }

  /**
   * Delete a practice location
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a practice location' })
  @ApiParam({ name: 'id', description: 'Practice location ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The practice location has been successfully deleted' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Practice location not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Cannot delete: location has associated appointments or is primary' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden - Requires admin role' 
  })
  async remove(@Param('id') id: string) {
    return this.practiceLocationsService.remove(BigInt(id));
  }
}
