import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvoiceStatus, FundingSource, InvoiceWhereInput } from '../../types/prisma-models';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

/**
 * Service for managing client invoices
 * Handles CRUD operations for invoices and related invoice items
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new invoice with items
   * @param createInvoiceDto - Data for creating the invoice
   * @param userId - ID of the user creating the invoice
   * @returns The created invoice with its items
   */
  async create(createInvoiceDto: CreateInvoiceDto, userId: bigint) {
    try {
      // Generate invoice number if not provided
      const invoiceNumber = createInvoiceDto.invoiceNumber || await this.generateInvoiceNumber();
      
      // Set issue date to today if not provided
      const issueDate = createInvoiceDto.issueDate 
        ? new Date(createInvoiceDto.issueDate) 
        : new Date();

      // Calculate total amount from items
      const totalAmount = createInvoiceDto.items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity) * Number(item.rate),
        0
      );

      return this.prisma.$transaction(async (prisma) => {
        // Create the invoice
        const invoice = await prisma.invoices.create({
          data: {
            client_id: BigInt(createInvoiceDto.clientId),
            invoice_number: invoiceNumber,
            issue_date: issueDate,
            due_date: new Date(createInvoiceDto.dueDate),
            status: createInvoiceDto.status || InvoiceStatus.DRAFT,
            notes: createInvoiceDto.notes,
            total_amount: totalAmount,
            amount_paid: 0,
            created_by: userId,
            // Cast to proper enum type from Prisma schema
            funding_source: createInvoiceDto.fundingProgramId ? FundingSource.GRANT : FundingSource.PRIVATE_PAY,
            subtotal: totalAmount,
            balance: totalAmount,
            updated_at: new Date(),
          },
        });

        // Create all invoice items
        const itemsPromises = createInvoiceDto.items.map(item => 
          prisma.invoice_line_items.create({
            data: {
              invoice_id: invoice.id,
              service_code_id: BigInt(item.serviceCodeId),
              description: item.description || '',
              quantity: Number(item.quantity),
              unit_price: Number(item.rate),
              line_total: Number(item.quantity) * Number(item.rate),
              service_date: item.dateOfService ? new Date(item.dateOfService) : new Date(),
              appointment_id: item.appointmentId ? BigInt(item.appointmentId) : null,
              tax_rate: 0, // Default values if not provided in DTO
              tax_amount: 0,
            },
          })
        );

        await Promise.all(itemsPromises);

        // If sendNotification is true, trigger notification here
        if (createInvoiceDto.sendNotification) {
          // This would integrate with a notification service
          // await this.notificationsService.sendInvoiceNotification(invoice.id);
          this.logger.log(`Notification for invoice ${invoice.id} would be sent here`);
        }

        // Return the created invoice with items
        return this.findOne(invoice.id);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to create invoice: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Get all invoices with optional filtering
   * @param filters - Optional filters for invoices
   * @returns List of invoices matching the criteria
   */
  async findAll(filters: {
    clientId?: string;
    status?: InvoiceStatus;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    insuranceProviderId?: string;
    fundingProgramId?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
  }) {
    try {
      // Build where clause based on filters
      const where: InvoiceWhereInput = {};
      
      if (filters.clientId) {
        where.client_id = BigInt(filters.clientId);
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      // Date range filtering
      if (filters.startDate && filters.endDate) {
        where.issue_date = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        };
      } else if (filters.startDate) {
        where.issue_date = {
          gte: new Date(filters.startDate),
        };
      }
      
      // Amount range filtering
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.total_amount = {};
        if (filters.minAmount && filters.maxAmount) {
          where.total_amount = {
            gte: filters.minAmount,
            lte: filters.maxAmount,
          };
        } else if (filters.minAmount) {
          where.total_amount = {
            gte: filters.minAmount,
          };
        } else if (filters.maxAmount) {
          where.total_amount = {
            lte: filters.maxAmount,
          };
        }
      }
      
      if (filters.insuranceProviderId) {
        // Skip filtering by insurance provider since it may not be directly available
        this.logger.warn('Filtering by insuranceProviderId is not supported in the current schema');
      }
      
      if (filters.fundingProgramId) {
        // Skip filtering by funding program since it may not be directly available
        this.logger.warn('Filtering by fundingProgramId is not supported in the current schema');
      }
      
      // Query for total count (for pagination)
      const totalCount = await this.prisma.invoices.count({ where });
      
      // Set default pagination values if not provided
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      // Query for invoices with pagination
      const invoices = await this.prisma.invoices.findMany({
        where,
        include: {
          clients: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              invoice_line_items: true,
              payments: true,
              insurance_claims: true,
            },
          },
        },
        orderBy: {
          issue_date: filters.sortBy === 'date_asc' ? 'asc' : 'desc',
          invoice_number: filters.sortBy === 'number_asc' ? 'asc' : 'desc',
        },
        take: limit,
        skip: offset,
      });
      
      return {
        totalCount,
        invoices,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Error finding invoices: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Get a specific invoice by ID with its items
   * @param id - ID of the invoice to find
   * @returns The invoice with its items if found
   * @throws NotFoundException if the invoice doesn't exist
   */
  /**
   * Find an invoice by invoice number
   * @param invoiceNumber - The invoice number to search for
   * @returns The invoice with its items and payments if found
   * @throws NotFoundException if the invoice doesn't exist
   */
  async findByInvoiceNumber(invoiceNumber: string) {
    try {
      const invoice = await this.prisma.invoices.findFirst({
        where: { invoice_number: invoiceNumber },
        include: {
          clients: true,
          invoice_line_items: true,
          payments: true,
          insurance_claims: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
      }

      return invoice;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to fetch invoice with number ${invoiceNumber}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Find an invoice by ID
   * @param id - The invoice ID
   * @returns The invoice with its items and payments if found
   * @throws NotFoundException if the invoice doesn't exist
   */
  async findOne(id: bigint) {
    try {
      // Check if invoice exists
      const invoice = await this.prisma.invoices.findUnique({
        where: { id },
        include: {
          invoice_line_items: true,
          payments: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      return invoice;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to fetch invoice with ID ${id}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Update an invoice and its items
   * @param id - ID of the invoice to update
   * @param updateInvoiceDto - Data for updating the invoice
   * @returns The updated invoice with its items
   * @throws NotFoundException if the invoice doesn't exist
   * @throws BadRequestException if trying to update a finalized invoice
   */
  async update(id: bigint, updateInvoiceDto: UpdateInvoiceDto) {
    try {
      // Check if invoice exists
      const invoice = await this.prisma.invoices.findUnique({
        where: { id },
        include: {
          invoice_line_items: true,
          payments: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      // Check if invoice can be updated
      if (invoice.status !== InvoiceStatus.DRAFT && 
        !updateInvoiceDto.status &&
        (updateInvoiceDto.items || updateInvoiceDto.itemsToRemove)
      ) {
        throw new BadRequestException(
          `Cannot modify items for an invoice with status ${invoice.status}. Change status to DRAFT first or only update the status.`
        );
      }

      return this.prisma.$transaction(async (prisma) => {
        // Process invoice updates
        let invoiceData: any = { ...updateInvoiceDto };
        
        // Convert date strings to Date objects
        if (updateInvoiceDto.issueDate) {
          invoiceData.issue_date = new Date(updateInvoiceDto.issueDate);
        }
        if (updateInvoiceDto.dueDate) {
          invoiceData.due_date = new Date(updateInvoiceDto.dueDate);
        }
        
        // Convert string IDs to BigInt
        if (updateInvoiceDto.clientId) {
          invoiceData.client_id = BigInt(updateInvoiceDto.clientId);
        }
        if (updateInvoiceDto.insuranceProviderId) {
          invoiceData.insurance_provider_id = BigInt(updateInvoiceDto.insuranceProviderId);
        }
        if (updateInvoiceDto.fundingProgramId) {
          invoiceData.funding_program_id = BigInt(updateInvoiceDto.fundingProgramId);
        }
        
        // Remove items and itemsToRemove from invoiceData
        delete invoiceData.items;
        delete invoiceData.itemsToRemove;
        
        // Process item updates if provided and invoice is in DRAFT status or just updating status
        if (updateInvoiceDto.items && invoice.status === InvoiceStatus.DRAFT) {
          // Create or update each item
          for (const itemData of updateInvoiceDto.items) {
            if (itemData.id) {
              // Update existing item
              await prisma.invoice_line_items.update({
                where: { id: BigInt(itemData.id) },
                data: {
                  // Use BigInt(0) as default since null isn't allowed
                  service_code_id: itemData.serviceCodeId ? BigInt(itemData.serviceCodeId) : BigInt(0),
                  description: itemData.description || '',
                  quantity: itemData.quantity ? Number(itemData.quantity) : 0,
                  unit_price: itemData.rate ? Number(itemData.rate) : 0,
                  line_total: (itemData.quantity ? Number(itemData.quantity) : 0) * (itemData.rate ? Number(itemData.rate) : 0),
                  service_date: itemData.dateOfService ? new Date(itemData.dateOfService) : new Date(),
                  appointment_id: itemData.appointmentId ? BigInt(itemData.appointmentId) : null,
                  tax_rate: 0, // Default values if not provided in DTO
                  tax_amount: 0,
                },
              });
            } else {
              // Create new item
              await prisma.invoice_line_items.create({
                data: {
                  invoice_id: id,
                  // Use BigInt(0) as default since null isn't allowed
                  service_code_id: itemData.serviceCodeId ? BigInt(itemData.serviceCodeId) : BigInt(0),
                  description: itemData.description || '',
                  quantity: itemData.quantity ? Number(itemData.quantity) : 0,
                  unit_price: itemData.rate ? Number(itemData.rate) : 0,
                  line_total: (itemData.quantity ? Number(itemData.quantity) : 0) * (itemData.rate ? Number(itemData.rate) : 0),
                  service_date: itemData.dateOfService ? new Date(itemData.dateOfService) : new Date(),
                  appointment_id: itemData.appointmentId ? BigInt(itemData.appointmentId) : null,
                  tax_rate: 0, // Default values if not provided in DTO
                  tax_amount: 0,
                },
              });
            }
          }
        }
        
        // Remove items if specified
        if (updateInvoiceDto.itemsToRemove && invoice.status === InvoiceStatus.DRAFT) {
          for (const itemId of updateInvoiceDto.itemsToRemove) {
            await prisma.invoice_line_items.delete({
              where: { id: BigInt(itemId) },
            });
          }
        }
        
        // Calculate total amount based on updated items
        const updatedItems = await prisma.invoice_line_items.findMany({
          where: { invoice_id: id },
        });
        
        // @ts-ignore - Adjust based on actual schema
        const totalPaymentAmount = await prisma.payments.aggregate({
          where: { invoice_id: id },
          _sum: { amount: true },
        });
        
        const paymentSum = totalPaymentAmount._sum.amount || 0;
        
        const totalAmount = updatedItems.reduce(
          (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_price),
          0
        );
        
        // Update the invoice record with calculations
        invoiceData.total_amount = totalAmount;
        
        // Update status based on payments
        if (updateInvoiceDto.status) {
          invoiceData.status = updateInvoiceDto.status;
        } else if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.CANCELLED) {
          // Calculate amount paid from payments
          const amountPaid = invoice.payments ? invoice.payments.reduce(
            (sum: number, payment: any) => sum + Number(payment.amount),
            0
          ) : 0;
          
          invoiceData.amount_paid = amountPaid;
          
          const remainingAmount = Number(invoice.total_amount) - Number(paymentSum);
          if (amountPaid >= totalAmount) {
            invoiceData.status = InvoiceStatus.PAID;
          } else if (amountPaid > 0) {
            invoiceData.status = InvoiceStatus.PARTIALLY_PAID;
          } else if (new Date() > invoice.due_date && invoice.status === InvoiceStatus.SENT) {
            invoiceData.status = InvoiceStatus.OVERDUE;
          }
        }
        
        // Update the invoice
        await this.prisma.invoices.update({
          where: { id },
          data: invoiceData,
        });
        
        // Return the updated invoice with items
        return this.findOne(id);
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to update invoice with ID ${id}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Delete an invoice and all its items
   * @param id - ID of the invoice to delete
   * @returns The deleted invoice
   * @throws NotFoundException if the invoice doesn't exist
   * @throws BadRequestException if invoice has payments
   */
  async remove(id: bigint) {
    try {
      // Check if invoice exists and has payments
      const invoice = await this.prisma.invoices.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              payments: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      // Check if invoice has payments
      if (invoice._count.payments > 0) {
        throw new BadRequestException(
          `Cannot delete invoice with ${invoice._count.payments} payments. Cancel it instead.`
        );
      }

      return this.prisma.$transaction(async (prisma) => {
        // Delete all invoice items
        await prisma.invoice_line_items.deleteMany({
          where: { invoice_id: id },
        });
        
        // Delete the invoice
        return prisma.invoices.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to delete invoice with ID ${id}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Generate a unique invoice number
   * Format: INV-YYYY-XXXXX where XXXXX is a sequential number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    
    // Find the highest invoice number for the current year
    const lastInvoice = await this.prisma.invoices.findFirst({
      where: {
        invoice_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoice_number: 'desc',
      },
    });
    
    if (!lastInvoice) {
      // No invoices for this year yet
      return `${prefix}00001`;
    }
    
    // Extract the sequence number from the last invoice
    let sequenceNumber = 1;
    if (lastInvoice && lastInvoice.invoice_number) {
      sequenceNumber = parseInt(lastInvoice.invoice_number.substring(prefix.length), 10);
    }
    const nextNumber = sequenceNumber + 1;
    
    // Pad with leading zeros to 5 digits
    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Update invoice status
   * @param id - ID of the invoice to update
   * @param status - New status
   * @returns The updated invoice
   */
  async updateStatus(id: bigint, status: InvoiceStatus) {
    return this.update(id, { status });
  }

  /**
   * Find overdue invoices
   * @returns List of overdue invoices
   */
  async getOverdueInvoices() {
    const today = new Date();
    try { 
      return this.prisma.invoices.findMany({
        where: {
          status: InvoiceStatus.SENT,
          due_date: {
            lt: today,
          },
        },
        include: {
          clients: true,
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.logger.error(`Failed to fetch overdue invoices: ${err.message}`, err.stack);
      throw err;
    }
  }
}
