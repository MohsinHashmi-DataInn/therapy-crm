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
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { FundingProgramsService } from './funding-programs.service';
import { CreateFundingProgramDto } from './dto/create-funding-program.dto';
import { UpdateFundingProgramDto } from './dto/update-funding-program.dto';

/**
 * Controller for managing funding programs
 * Provides endpoints for CRUD operations on government and private funding programs
 */
@ApiTags('funding-programs')
@Controller('funding-programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FundingProgramsController {
  constructor(private readonly fundingProgramsService: FundingProgramsService) {}

  /**
   * Create a new funding program
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new funding program' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The funding program has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A funding program with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async create(@Body() createFundingProgramDto: CreateFundingProgramDto, @Request() req: any) {
    return this.fundingProgramsService.create(createFundingProgramDto, BigInt(req.user.id));
  }

  /**
   * Get all funding programs with optional filtering for active programs only
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all funding programs with optional filtering for active programs only' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to show only active programs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all funding programs matching the criteria',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const activeOnlyBool = activeOnly === 'true';
    return this.fundingProgramsService.findAll(activeOnlyBool);
  }

  /**
   * Get a specific funding program by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific funding program by ID' })
  @ApiParam({ name: 'id', description: 'Funding program ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the funding program',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Funding program not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findOne(@Param('id') id: string) {
    return this.fundingProgramsService.findOne(BigInt(id));
  }

  /**
   * Get a specific funding program by name
   */
  @Get('by-name/:name')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific funding program by name' })
  @ApiParam({ name: 'name', description: 'Funding program name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the funding program',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Funding program not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByName(@Param('name') name: string) {
    return this.fundingProgramsService.findByName(name);
  }

  /**
   * Update a funding program
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a funding program' })
  @ApiParam({ name: 'id', description: 'Funding program ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The funding program has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Funding program not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A funding program with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async update(
    @Param('id') id: string,
    @Body() updateFundingProgramDto: UpdateFundingProgramDto,
  ) {
    return this.fundingProgramsService.update(BigInt(id), updateFundingProgramDto);
  }

  /**
   * Delete a funding program
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a funding program' })
  @ApiParam({ name: 'id', description: 'Funding program ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The funding program has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Funding program not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete funding program that is associated with clients',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin role',
  })
  async remove(@Param('id') id: string) {
    return this.fundingProgramsService.remove(BigInt(id));
  }
}
