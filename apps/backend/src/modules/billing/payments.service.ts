import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { InvoiceStatus, PaymentMethod } from '../../types/prisma-models';

/**
 * Service for managing payments
 * Handles CRUD operations for invoice payments and updates invoice status accordingly
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new payment
   * @param createPaymentDto - Data for creating the payment
   * @param userId - ID of the user creating the payment
   * @returns The created payment
   * @throws NotFoundException if the invoice doesn't exist
   * @throws BadRequestException if payment amount is invalid
   */
  async create(createPaymentDto: CreatePaymentDto, userId: bigint) {
    try {
      const invoiceId = BigInt(createPaymentDto.invoiceId);
      
      // Check if invoice exists
      const invoice = await this.prisma.invoices.findUnique({
        where: { id: invoiceId },
        include: {
          payments: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${createPaymentDto.invoiceId} not found`);
      }

      // Check if payment amount is valid
      const currentAmountPaid = invoice.payments.reduce(
        (sum: number, payment: { amount: number | bigint | Decimal }) => sum + Number(payment.amount),
        0
      );
      
      const totalWithNewPayment = currentAmountPaid + createPaymentDto.amount;
      
      if (totalWithNewPayment > Number(invoice.total_amount)) {
        throw new BadRequestException(
          `Payment amount would exceed invoice total. Current: $${currentAmountPaid}, New payment: $${createPaymentDto.amount}, Invoice total: $${invoice.total_amount}`
        );
      }

      return this.prisma.$transaction(async (prisma) => {
        // Create the payment
        const payment = await prisma.payments.create({
          data: {
            invoice_id: invoiceId,
            amount: createPaymentDto.amount,
            payment_date: new Date(createPaymentDto.date),
            payment_method: createPaymentDto.method as PaymentMethod,
            reference_number: createPaymentDto.referenceNumber,
            notes: createPaymentDto.notes,
            // Convert insurance claim ID if provided
            ...(createPaymentDto.insuranceClaimId ? { insurance_claim_id: BigInt(createPaymentDto.insuranceClaimId) } : {}),
            // Add funding program reference if provided
            ...(createPaymentDto.fundingProgramReference ? { funding_program_reference: createPaymentDto.fundingProgramReference } : {}),
            received_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Update the invoice status
        const newTotalPaid = currentAmountPaid + createPaymentDto.amount;
        let newStatus: InvoiceStatus;
        
        if (newTotalPaid >= Number(invoice.total_amount)) {
          newStatus = InvoiceStatus.PAID;
        } else if (newTotalPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        } else {
          newStatus = InvoiceStatus.SENT; // No payments, back to sent
        }
        
        await prisma.invoices.update({
          where: { id: invoiceId },
          data: {
            amount_paid: newTotalPaid,
            status: newStatus,
          },
        });

        return payment;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to create payment: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Get all payments with optional filtering
   * @param filters - Optional filters for payments
   * @returns List of payments matching the criteria
   */
  async findAll(filters: {
    invoiceId?: string;
    clientId?: string;
    method?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Build where clause based on filters
      const where: any = {};
      
      if (filters.invoiceId) {
        where.invoice_id = BigInt(filters.invoiceId);
      }
      
      if (filters.clientId) {
        where.invoices = {
          client_id: BigInt(filters.clientId),
        };
      }
      
      if (filters.method) {
        where.payment_method = filters.method as PaymentMethod;
      }
      
      // Date range filtering
      if (filters.from || filters.to) {
        where.payment_date = {};
        if (filters.from) {
          where.payment_date.gte = new Date(filters.from);
        }
        if (filters.to) {
          where.payment_date.lte = new Date(filters.to);
        }
      }
      
      // Query for total count (for pagination)
      const totalCount = await this.prisma.payments.count({ where });
      
      // Set default pagination values if not provided
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      // Query for payments with pagination
      const payments = await this.prisma.payments.findMany({
        where,
        include: {
          invoices: {
            select: {
              id: true,
              invoice_number: true,
              client_id: true,
              clients: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          payment_date: 'desc',
          created_at: 'desc',
        },
        take: limit,
        skip: offset,
      });
      
      return {
        totalCount,
        payments,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to fetch payments: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Get a specific payment by ID
   * @param id - ID of the payment to find
   * @returns The payment if found
   * @throws NotFoundException if the payment doesn't exist
   */
  async findOne(id: bigint) {
    try {
      const payment = await this.prisma.payments.findUnique({
        where: { id },
        include: {
          invoices: {
            select: {
              id: true,
              invoice_number: true,
              client_id: true,
              total_amount: true,
              amount_paid: true,
              clients: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                },
              },
            },
          },
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      return payment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to fetch payment with ID ${id}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Update a payment
   * @param id - ID of the payment to update
   * @param updatePaymentDto - Data for updating the payment
   * @returns The updated payment
   * @throws NotFoundException if the payment doesn't exist
   * @throws BadRequestException if payment amount is invalid
   */
  async update(id: bigint, updatePaymentDto: UpdatePaymentDto) {
    try {
      // Check if payment exists
      const payment = await this.prisma.payments.findUnique({
        where: { id },
        include: {
          invoices: {
            include: {
              payments: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      // If amount is being updated, check if it's valid
      if (updatePaymentDto.amount !== undefined) {
        const currentTotalPaid = payment.invoices.payments.reduce(
          (sum, p) => sum + (p.id === id ? 0 : Number(p.amount)),
          0
        );
        
        const totalWithNewAmount = currentTotalPaid + updatePaymentDto.amount;
        
        if (totalWithNewAmount > Number(payment.invoices.total_amount)) {
          throw new BadRequestException(
            `Updated payment amount would exceed invoice total. Other payments: $${currentTotalPaid}, New amount: $${updatePaymentDto.amount}, Invoice total: $${payment.invoices.total_amount}`
          );
        }
      }

      return this.prisma.$transaction(async (prisma) => {
        // Update payment
        const updatedPayment = await prisma.payments.update({
          where: { id },
          data: {
            amount: updatePaymentDto.amount,
            payment_date: updatePaymentDto.date ? new Date(updatePaymentDto.date) : undefined,
            payment_method: updatePaymentDto.method as PaymentMethod,
            reference_number: updatePaymentDto.referenceNumber,
            notes: updatePaymentDto.notes,
            // Handle optional fields using spread operator to avoid TypeScript errors
            ...(updatePaymentDto.insuranceClaimId ? { insurance_claim_id: BigInt(updatePaymentDto.insuranceClaimId) } : {}),
            ...(updatePaymentDto.fundingProgramReference ? { funding_program_reference: updatePaymentDto.fundingProgramReference } : {}),
            updated_at: new Date(),
          },
        });

        // If amount changed, update the invoice
        if (updatePaymentDto.amount !== undefined) {
          // Recalculate total paid amount
          const payments = await this.prisma.payments.findMany({
            where: { invoice_id: payment.invoices.id },
          });
          
          const newTotalPaid = payments.reduce(
            (sum: number, p: { amount: number | bigint | Decimal }) => sum + Number(p.amount),
            0
          );
          
          let newStatus: InvoiceStatus;
          
          if (newTotalPaid >= Number(payment.invoices.total_amount)) {
            newStatus = InvoiceStatus.PAID;
          } else if (newTotalPaid > 0) {
            newStatus = InvoiceStatus.PARTIALLY_PAID;
          } else {
            newStatus = InvoiceStatus.SENT; // No payments, back to sent
          }
          
          await prisma.invoices.update({
            where: { id: payment.invoices.id },
            data: {
              amount_paid: newTotalPaid,
              status: newStatus,
            },
          });
        }

        return this.findOne(id);
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to update payment with ID ${id}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Delete a payment
   * @param id - ID of the payment to delete
   * @returns The deleted payment
   * @throws NotFoundException if the payment doesn't exist
   */
  async remove(id: bigint) {
    try {
      // Check if payment exists
      const payment = await this.prisma.payments.findUnique({
        where: { id },
        include: {
          invoices: true,
        },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      return this.prisma.$transaction(async (prisma) => {
        // Delete the payment
        const deletedPayment = await prisma.payments.delete({
          where: { id },
        });

        // Update the invoice
        // First get all remaining payments
        const remainingPayments = await prisma.payments.findMany({
          where: {
            invoice_id: payment.invoices.id,
            id: { not: id },
          },
        });
        
        // Calculate new amount paid
        const newAmountPaid = remainingPayments.reduce(
          (sum: number, p: { amount: number | bigint | Decimal }) => sum + Number(p.amount),
          0
        );
        
        // Determine new status
        let newStatus: InvoiceStatus;
        
        if (newAmountPaid >= Number(payment.invoices.total_amount)) {
          newStatus = InvoiceStatus.PAID;
        } else if (newAmountPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        } else if (new Date() > payment.invoices.due_date) {
          newStatus = InvoiceStatus.OVERDUE;
        } else {
          newStatus = InvoiceStatus.SENT;
        }
        
        await prisma.invoices.update({
          where: { id: payment.invoices.id },
          data: {
            amount_paid: newAmountPaid,
            status: newStatus,
          },
        });

        return deletedPayment;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to delete payment with ID ${id}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Get payments for a specific invoice
   * @param invoiceId - ID of the invoice
   * @returns List of payments for the invoice
   */
  async findByInvoiceId(invoiceId: bigint) {
    try {
      return this.prisma.payments.findMany({
        where: { invoice_id: invoiceId },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { payment_date: 'desc' },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to fetch payments for invoice ${invoiceId}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Get payments for a specific client
   * @param clientId - ID of the client
   * @returns List of payments for the client
   */
  async findByClientId(clientId: bigint) {
    try {
      const payments = await this.prisma.payments.findMany({
        where: {
          invoices: {
            client_id: BigInt(clientId),
          },
        },
        include: {
          invoices: {
            select: {
              id: true,
              invoice_number: true,
            },
          },
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { payment_date: 'desc' },
      });
      return payments;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to fetch payments for client ${clientId}: ${err.message}`, err.stack);
      throw err;
    }
  }
}
