import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InvoiceStatus } from './dto/create-invoice.dto';

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
      const invoice = await this.prisma.invoice.findUnique({
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
        (sum, payment) => sum + Number(payment.amount),
        0
      );
      
      const totalWithNewPayment = currentAmountPaid + createPaymentDto.amount;
      
      if (totalWithNewPayment > Number(invoice.totalAmount)) {
        throw new BadRequestException(
          `Payment amount would exceed invoice total. Current: $${currentAmountPaid}, New payment: $${createPaymentDto.amount}, Invoice total: $${invoice.totalAmount}`
        );
      }

      return this.prisma.$transaction(async (prisma) => {
        // Create the payment
        const payment = await prisma.payment.create({
          data: {
            invoiceId,
            amount: createPaymentDto.amount,
            date: new Date(createPaymentDto.date),
            method: createPaymentDto.method,
            referenceNumber: createPaymentDto.referenceNumber,
            notes: createPaymentDto.notes,
            insuranceClaimId: createPaymentDto.insuranceClaimId,
            fundingProgramReference: createPaymentDto.fundingProgramReference,
            createdById: userId,
          },
        });

        // Update the invoice status
        const newTotalPaid = currentAmountPaid + createPaymentDto.amount;
        let newStatus = invoice.status;
        
        if (newTotalPaid >= Number(invoice.totalAmount)) {
          newStatus = InvoiceStatus.PAID;
        } else if (newTotalPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        }
        
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            amountPaid: newTotalPaid,
            status: newStatus,
          },
        });

        return payment;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create payment: ${error.message}`, error.stack);
      throw error;
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
        where.invoiceId = BigInt(filters.invoiceId);
      }
      
      if (filters.clientId) {
        where.invoice = {
          clientId: BigInt(filters.clientId),
        };
      }
      
      if (filters.method) {
        where.method = filters.method;
      }
      
      // Date range filtering
      if (filters.from || filters.to) {
        where.date = {};
        if (filters.from) {
          where.date.gte = new Date(filters.from);
        }
        if (filters.to) {
          where.date.lte = new Date(filters.to);
        }
      }
      
      // Query for total count (for pagination)
      const totalCount = await this.prisma.payment.count({ where });
      
      // Set default pagination values if not provided
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      // Query for payments with pagination
      const payments = await this.prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              clientId: true,
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      });
      
      return {
        totalCount,
        payments,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payments: ${error.message}`, error.stack);
      throw error;
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
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              clientId: true,
              totalAmount: true,
              amountPaid: true,
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
      this.logger.error(`Failed to fetch payment with ID ${id}: ${error.message}`, error.stack);
      throw error;
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
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
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
        const currentTotalPaid = payment.invoice.payments.reduce(
          (sum, p) => sum + (p.id === id ? 0 : Number(p.amount)),
          0
        );
        
        const totalWithNewAmount = currentTotalPaid + updatePaymentDto.amount;
        
        if (totalWithNewAmount > Number(payment.invoice.totalAmount)) {
          throw new BadRequestException(
            `Updated payment amount would exceed invoice total. Other payments: $${currentTotalPaid}, New amount: $${updatePaymentDto.amount}, Invoice total: $${payment.invoice.totalAmount}`
          );
        }
      }

      return this.prisma.$transaction(async (prisma) => {
        // Update payment
        const updatedPayment = await prisma.payment.update({
          where: { id },
          data: {
            amount: updatePaymentDto.amount,
            date: updatePaymentDto.date ? new Date(updatePaymentDto.date) : undefined,
            method: updatePaymentDto.method,
            referenceNumber: updatePaymentDto.referenceNumber,
            notes: updatePaymentDto.notes,
            insuranceClaimId: updatePaymentDto.insuranceClaimId,
            fundingProgramReference: updatePaymentDto.fundingProgramReference,
          },
        });

        // If amount changed, update the invoice
        if (updatePaymentDto.amount !== undefined) {
          // Recalculate total paid amount
          const allPayments = await prisma.payment.findMany({
            where: { invoiceId: payment.invoiceId },
          });
          
          const newTotalPaid = allPayments.reduce(
            (sum, p) => sum + Number(p.amount),
            0
          );
          
          let newStatus = payment.invoice.status;
          
          if (newTotalPaid >= Number(payment.invoice.totalAmount)) {
            newStatus = InvoiceStatus.PAID;
          } else if (newTotalPaid > 0) {
            newStatus = InvoiceStatus.PARTIALLY_PAID;
          } else {
            newStatus = InvoiceStatus.SENT; // No payments, back to sent
          }
          
          await prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: {
              amountPaid: newTotalPaid,
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
      this.logger.error(`Failed to update payment with ID ${id}: ${error.message}`, error.stack);
      throw error;
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
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: true,
        },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      return this.prisma.$transaction(async (prisma) => {
        // Delete the payment
        const deletedPayment = await prisma.payment.delete({
          where: { id },
        });

        // Update the invoice
        // First get all remaining payments
        const remainingPayments = await prisma.payment.findMany({
          where: {
            invoiceId: payment.invoiceId,
            id: { not: id },
          },
        });
        
        // Calculate new amount paid
        const newAmountPaid = remainingPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        
        // Determine new status
        let newStatus: InvoiceStatus;
        
        if (newAmountPaid >= Number(payment.invoice.totalAmount)) {
          newStatus = InvoiceStatus.PAID;
        } else if (newAmountPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        } else if (new Date() > payment.invoice.dueDate) {
          newStatus = InvoiceStatus.OVERDUE;
        } else {
          newStatus = InvoiceStatus.SENT;
        }
        
        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            status: newStatus,
          },
        });

        return deletedPayment;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete payment with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payments for a specific invoice
   * @param invoiceId - ID of the invoice
   * @returns List of payments for the invoice
   */
  async findByInvoiceId(invoiceId: bigint) {
    try {
      return this.prisma.payment.findMany({
        where: { invoiceId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch payments for invoice ${invoiceId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payments for a specific client
   * @param clientId - ID of the client
   * @returns List of payments for the client
   */
  async findByClientId(clientId: bigint) {
    try {
      return this.prisma.payment.findMany({
        where: {
          invoice: {
            clientId,
          },
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch payments for client ${clientId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
