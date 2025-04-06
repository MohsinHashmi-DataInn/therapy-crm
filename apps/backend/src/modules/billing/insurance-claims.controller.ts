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
import { InsuranceClaimsService } from './insurance-claims.service';
import { CreateInsuranceClaimDto } from './dto/create-insurance-claim.dto';
import { ClaimStatus } from '../../types/prisma-models';
import { UpdateInsuranceClaimDto } from './dto/update-insurance-claim.dto';

/**
 * Controller for managing insurance claims
 * Provides endpoints for CRUD operations on insurance claims
 */
@ApiTags('insurance-claims')
@Controller('insurance-claims')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InsuranceClaimsController {
  constructor(private readonly insuranceClaimsService: InsuranceClaimsService) {}

  /**
   * Create a new insurance claim
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new insurance claim' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The insurance claim has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or no valid invoice items to claim',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice or insurance provider not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async create(@Body() createInsuranceClaimDto: CreateInsuranceClaimDto, @Request() req: any) {
    return this.insuranceClaimsService.create(createInsuranceClaimDto, req.user.id);
  }

  /**
   * Get all insurance claims with optional filtering
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all insurance claims with optional filtering' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ClaimStatus,
    description: 'Filter by claim status',
  })
  @ApiQuery({
    name: 'insuranceId',
    required: false,
    type: String,
    description: 'Filter by insurance ID',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Filter by submission date (from) in ISO format',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'Filter by submission date (to) in ISO format',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    type: String,
    description: 'Filter by client ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Pagination limit (default: 50)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Pagination page (default: 1)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all insurance claims matching the criteria',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async findAll(
    @Query('status') status?: ClaimStatus,
    @Query('insuranceId') insuranceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('clientId') clientId?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.insuranceClaimsService.findAll({
      status,
      insuranceId,
      from,
      to,
      clientId,
      limit,
      page,
    });
  }

  /**
   * Get a specific insurance claim by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a specific insurance claim by ID' })
  @ApiParam({ name: 'id', description: 'Insurance claim ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the insurance claim',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insurance claim not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async findOne(@Param('id') id: string) {
    return this.insuranceClaimsService.findOne(id);
  }

  /**
   * Get all insurance claims for a specific invoice
   */
  @Get('invoice/:invoiceId')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all insurance claims for a specific invoice' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all insurance claims for the invoice',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByInvoiceId(@Param('invoiceId') invoiceId: string) {
    return this.insuranceClaimsService.findByInvoiceId(BigInt(invoiceId));
  }

  /**
   * Get all insurance claims for a specific client
   */
  @Get('client/:clientId')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all insurance claims for a specific client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all insurance claims for the client',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByClientId(@Param('clientId') clientId: string) {
    return this.insuranceClaimsService.findByClientId(BigInt(clientId));
  }

  /**
   * Update an insurance claim
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update an insurance claim' })
  @ApiParam({ name: 'id', description: 'Insurance claim ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The insurance claim has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or trying to modify a submitted claim',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insurance claim not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async update(@Param('id') id: string, @Body() updateInsuranceClaimDto: UpdateInsuranceClaimDto, @Request() req: any) {
    return this.insuranceClaimsService.update(id, updateInsuranceClaimDto, BigInt(req.user.id));
  }

  /**
   * Update an insurance claim status
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update an insurance claim status' })
  @ApiParam({ name: 'id', description: 'Insurance claim ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The insurance claim status has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insurance claim not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ClaimStatus,
    @Request() req: any,
  ) {
    return this.insuranceClaimsService.updateStatus(id, status, BigInt(req.user.id));
  }

  /**
   * Delete an insurance claim
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an insurance claim' })
  @ApiParam({ name: 'id', description: 'Insurance claim ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The insurance claim has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete claim that is not in DRAFT status',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insurance claim not found',
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
    return this.insuranceClaimsService.remove(id);
  }
}
