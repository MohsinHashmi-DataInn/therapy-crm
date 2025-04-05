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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

/**
 * Controller for managing payments
 * Provides endpoints for CRUD operations on invoice payments
 */
@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a new payment
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The payment has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or payment amount exceeds invoice total',
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
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.create(createPaymentDto, BigInt(req.user.id));
  }

  /**
   * Get all payments with optional filtering
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all payments with optional filtering' })
  @ApiQuery({
    name: 'invoiceId',
    required: false,
    type: String,
    description: 'Filter by invoice ID',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    type: String,
    description: 'Filter by client ID',
  })
  @ApiQuery({
    name: 'method',
    required: false,
    enum: PaymentMethod,
    description: 'Filter by payment method',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Filter by payment date (from) in ISO format',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'Filter by payment date (to) in ISO format',
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
    description: 'Returns all payments matching the criteria',
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
    @Query('invoiceId') invoiceId?: string,
    @Query('clientId') clientId?: string,
    @Query('method') method?: PaymentMethod,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentsService.findAll({
      invoiceId,
      clientId,
      method,
      from,
      to,
      limit,
      offset,
    });
  }

  /**
   * Get a specific payment by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the payment',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
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
    return this.paymentsService.findOne(BigInt(id));
  }

  /**
   * Get all payments for a specific invoice
   */
  @Get('invoice/:invoiceId')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all payments for a specific invoice' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all payments for the invoice',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByInvoiceId(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.findByInvoiceId(BigInt(invoiceId));
  }

  /**
   * Get all payments for a specific client
   */
  @Get('client/:clientId')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all payments for a specific client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all payments for the client',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findByClientId(@Param('clientId') clientId: string) {
    return this.paymentsService.findByClientId(BigInt(clientId));
  }

  /**
   * Update a payment
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The payment has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or payment amount exceeds invoice total',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin or staff role',
  })
  async update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(BigInt(id), updatePaymentDto);
  }

  /**
   * Delete a payment
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The payment has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
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
    return this.paymentsService.remove(BigInt(id));
  }
}
