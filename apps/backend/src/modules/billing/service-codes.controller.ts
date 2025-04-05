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
import { ServiceCodesService } from './service-codes.service';
import { CreateServiceCodeDto } from './dto/create-service-code.dto';
import { UpdateServiceCodeDto } from './dto/update-service-code.dto';

/**
 * Controller for managing therapy service codes
 * Provides endpoints for CRUD operations on billing codes used in invoicing
 */
@ApiTags('service-codes')
@Controller('service-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceCodesController {
  constructor(private readonly serviceCodesService: ServiceCodesService) {}

  /**
   * Create a new service code
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new service code' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The service code has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A service code with this code already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async create(@Body() createServiceCodeDto: CreateServiceCodeDto, @Request() req: any) {
    return this.serviceCodesService.create(createServiceCodeDto, BigInt(req.user.id));
  }

  /**
   * Get all service codes with optional filtering
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all service codes with optional filtering' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to show only active service codes',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter service codes by category',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all service codes matching the criteria',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('category') category?: string,
  ) {
    const activeOnlyBool = activeOnly === 'true';
    return this.serviceCodesService.findAll(activeOnlyBool, category);
  }

  /**
   * Get a specific service code by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific service code by ID' })
  @ApiParam({ name: 'id', description: 'Service code ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the service code',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service code not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findOne(@Param('id') id: string) {
    return this.serviceCodesService.findOne(BigInt(id));
  }

  /**
   * Get a specific service code by code
   */
  @Get('by-code/:code')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific service code by code' })
  @ApiParam({ name: 'code', description: 'Service code (e.g., CPT code)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the service code',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service code not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByCode(@Param('code') code: string) {
    return this.serviceCodesService.findByCode(code);
  }

  /**
   * Get all service code categories
   */
  @Get('categories/list')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all service code categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of all unique categories used in service codes',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getCategories() {
    return this.serviceCodesService.getCategories();
  }

  /**
   * Update a service code
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a service code' })
  @ApiParam({ name: 'id', description: 'Service code ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The service code has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service code not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A service code with this code already exists',
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
    @Body() updateServiceCodeDto: UpdateServiceCodeDto,
  ) {
    return this.serviceCodesService.update(BigInt(id), updateServiceCodeDto);
  }

  /**
   * Delete a service code
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a service code' })
  @ApiParam({ name: 'id', description: 'Service code ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The service code has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service code not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete a service code that is being used in invoices or appointments',
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
    return this.serviceCodesService.remove(BigInt(id));
  }
}
