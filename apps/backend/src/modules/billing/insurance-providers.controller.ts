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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { InsuranceProvidersService } from './insurance-providers.service';
import { CreateInsuranceProviderDto } from './dto/create-insurance-provider.dto';
import { UpdateInsuranceProviderDto } from './dto/update-insurance-provider.dto';

/**
 * Controller for managing insurance providers
 * Provides endpoints for CRUD operations on insurance providers
 */
@ApiTags('insurance-providers')
@Controller('insurance-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InsuranceProvidersController {
  constructor(private readonly insuranceProvidersService: InsuranceProvidersService) {}

  /**
   * Create a new insurance provider
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new insurance provider' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The insurance provider has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'An insurance provider with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async create(@Body() createInsuranceProviderDto: CreateInsuranceProviderDto, @Request() req: any) {
    return this.insuranceProvidersService.create(createInsuranceProviderDto, BigInt(req.user.id));
  }

  /**
   * Get all insurance providers
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all insurance providers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all insurance providers',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findAll() {
    return this.insuranceProvidersService.findAll();
  }

  /**
   * Get a specific insurance provider by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific insurance provider by ID' })
  @ApiParam({ name: 'id', description: 'Insurance provider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the insurance provider',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insurance provider not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findOne(@Param('id') id: string) {
    return this.insuranceProvidersService.findOne(BigInt(id));
  }

  /**
   * Get a specific insurance provider by name
   */
  @Get('by-name/:name')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific insurance provider by name' })
  @ApiParam({ name: 'name', description: 'Insurance provider name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the insurance provider',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insurance provider not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByName(@Param('name') name: string) {
    return this.insuranceProvidersService.findByName(name);
  }

  /**
   * Update an insurance provider
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update an insurance provider' })
  @ApiParam({ name: 'id', description: 'Insurance provider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The insurance provider has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insurance provider not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'An insurance provider with this name already exists',
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
    @Body() updateInsuranceProviderDto: UpdateInsuranceProviderDto,
  ) {
    return this.insuranceProvidersService.update(BigInt(id), updateInsuranceProviderDto);
  }

  /**
   * Delete an insurance provider
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an insurance provider' })
  @ApiParam({ name: 'id', description: 'Insurance provider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The insurance provider has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insurance provider not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete insurance provider that is associated with clients or claims',
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
    return this.insuranceProvidersService.remove(BigInt(id));
  }
}
