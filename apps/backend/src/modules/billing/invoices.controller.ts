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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, InvoiceStatus } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

/**
 * Controller for managing invoices
 * Provides endpoints for CRUD operations on invoices and related invoice items
 */
@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * Create a new invoice
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The invoice has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req: any) {
    return this.invoicesService.create(createInvoiceDto, BigInt(req.user.id));
  }

  /**
   * Get all invoices with optional filtering
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all invoices with optional filtering' })
  @ApiQuery({
    name: 'clientId',
    required: false,
    type: String,
    description: 'Filter by client ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InvoiceStatus,
    description: 'Filter by invoice status',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Filter by issue date (from) in ISO format',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'Filter by issue date (to) in ISO format',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Filter by minimum invoice amount',
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    type: Number,
    description: 'Filter by maximum invoice amount',
  })
  @ApiQuery({
    name: 'insuranceProviderId',
    required: false,
    type: String,
    description: 'Filter by insurance provider ID',
  })
  @ApiQuery({
    name: 'fundingProgramId',
    required: false,
    type: String,
    description: 'Filter by funding program ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Pagination limit (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Pagination offset (default: 0)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all invoices matching the criteria',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findAll(
    @Query('clientId') clientId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('insuranceProviderId') insuranceProviderId?: string,
    @Query('fundingProgramId') fundingProgramId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.invoicesService.findAll({
      clientId,
      status,
      from,
      to,
      minAmount,
      maxAmount,
      insuranceProviderId,
      fundingProgramId,
      limit,
      offset,
    });
  }

  /**
   * Get a specific invoice by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the invoice with items and payments',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(BigInt(id));
  }

  /**
   * Get a specific invoice by invoice number
   */
  @Get('by-number/:invoiceNumber')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get a specific invoice by invoice number' })
  @ApiParam({ name: 'invoiceNumber', description: 'Invoice number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the invoice with items and payments',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.findByInvoiceNumber(invoiceNumber);
  }

  /**
   * Update a specific invoice
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a specific invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The invoice has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or trying to update a finalized invoice',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(BigInt(id), updateInvoiceDto);
  }

  /**
   * Update just the status of an invoice
   */
  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update the status of an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The invoice status has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
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
    @Body() body: { status: InvoiceStatus },
  ) {
    return this.invoicesService.updateStatus(BigInt(id), body.status);
  }

  /**
   * Delete an invoice
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The invoice has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete an invoice with payments',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
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
    return this.invoicesService.remove(BigInt(id));
  }

  /**
   * Get overdue invoices for notification
   */
  @Get('status/overdue')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get overdue invoices for notification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of overdue invoices',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async getOverdueInvoices() {
    return this.invoicesService.getOverdueInvoices();
  }
}
