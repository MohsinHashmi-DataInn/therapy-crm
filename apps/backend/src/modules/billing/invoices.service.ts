import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInvoiceDto, InvoiceStatus } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Prisma } from '@prisma/client';

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
        (sum, item) => sum + (item.quantity * item.rate),
        0
      );

      return this.prisma.$transaction(async (prisma) => {
        // Create the invoice
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            clientId: BigInt(createInvoiceDto.clientId),
            issueDate,
            dueDate: new Date(createInvoiceDto.dueDate),
            status: createInvoiceDto.status || InvoiceStatus.DRAFT,
            notes: createInvoiceDto.notes,
            totalAmount,
            amountPaid: 0,
            insuranceProviderId: createInvoiceDto.insuranceProviderId 
              ? BigInt(createInvoiceDto.insuranceProviderId) 
              : null,
            policyNumber: createInvoiceDto.policyNumber,
            beneficiaryName: createInvoiceDto.beneficiaryName,
            fundingProgramId: createInvoiceDto.fundingProgramId 
              ? BigInt(createInvoiceDto.fundingProgramId) 
              : null,
            createdById: userId,
          },
        });

        // Create all invoice items
        const itemsPromises = createInvoiceDto.items.map(item => 
          prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              serviceCodeId: BigInt(item.serviceCodeId),
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.quantity * item.rate,
              dateOfService: new Date(item.dateOfService),
              appointmentId: item.appointmentId ? BigInt(item.appointmentId) : null,
              billToInsurance: item.billToInsurance || false,
              notes: item.notes,
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
      this.logger.error(`Failed to create invoice: ${error.message}`, error.stack);
      throw error;
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
    from?: string;
    to?: string;
    minAmount?: number;
    maxAmount?: number;
    insuranceProviderId?: string;
    fundingProgramId?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Build where clause based on filters
      const where: Prisma.InvoiceWhereInput = {};
      
      if (filters.clientId) {
        where.clientId = BigInt(filters.clientId);
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      // Date range filtering
      if (filters.from || filters.to) {
        where.issueDate = {};
        if (filters.from) {
          where.issueDate.gte = new Date(filters.from);
        }
        if (filters.to) {
          where.issueDate.lte = new Date(filters.to);
        }
      }
      
      // Amount range filtering
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.totalAmount = {};
        if (filters.minAmount !== undefined) {
          where.totalAmount.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          where.totalAmount.lte = filters.maxAmount;
        }
      }
      
      if (filters.insuranceProviderId) {
        where.insuranceProviderId = BigInt(filters.insuranceProviderId);
      }
      
      if (filters.fundingProgramId) {
        where.fundingProgramId = BigInt(filters.fundingProgramId);
      }
      
      // Query for total count (for pagination)
      const totalCount = await this.prisma.invoice.count({ where });
      
      // Set default pagination values if not provided
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      // Query for invoices with pagination
      const invoices = await this.prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          insuranceProvider: {
            select: {
              id: true,
              name: true,
            },
          },
          fundingProgram: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
              payments: true,
            },
          },
        },
        orderBy: [
          { issueDate: 'desc' },
          { invoiceNumber: 'desc' },
        ],
        take: limit,
        skip: offset,
      });
      
      return {
        totalCount,
        invoices,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch invoices: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific invoice by ID with its items
   * @param id - ID of the invoice to find
   * @returns The invoice with its items if found
   * @throws NotFoundException if the invoice doesn't exist
   */
  async findOne(id: bigint) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          items: {
            include: {
              serviceCode: true,
              appointment: {
                select: {
                  id: true,
                  startTime: true,
                  endTime: true,
                },
              },
            },
            orderBy: { dateOfService: 'asc' },
          },
          payments: {
            orderBy: { date: 'desc' },
          },
          insuranceProvider: true,
          fundingProgram: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
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
      this.logger.error(`Failed to fetch invoice with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific invoice by invoice number
   * @param invoiceNumber - Invoice number to find
   * @returns The invoice if found
   * @throws NotFoundException if the invoice doesn't exist
   */
  async findByInvoiceNumber(invoiceNumber: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { invoiceNumber },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          items: {
            include: {
              serviceCode: true,
              appointment: {
                select: {
                  id: true,
                  startTime: true,
                  endTime: true,
                },
              },
            },
            orderBy: { dateOfService: 'asc' },
          },
          payments: {
            orderBy: { date: 'desc' },
          },
          insuranceProvider: true,
          fundingProgram: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with number '${invoiceNumber}' not found`);
      }

      return invoice;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch invoice with number '${invoiceNumber}': ${error.message}`, error.stack);
      throw error;
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
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: {
          items: true,
          payments: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      // Check if invoice can be updated
      if (
        invoice.status !== InvoiceStatus.DRAFT && 
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
          invoiceData.issueDate = new Date(updateInvoiceDto.issueDate);
        }
        if (updateInvoiceDto.dueDate) {
          invoiceData.dueDate = new Date(updateInvoiceDto.dueDate);
        }
        
        // Convert string IDs to BigInt
        if (updateInvoiceDto.clientId) {
          invoiceData.clientId = BigInt(updateInvoiceDto.clientId);
        }
        if (updateInvoiceDto.insuranceProviderId) {
          invoiceData.insuranceProviderId = BigInt(updateInvoiceDto.insuranceProviderId);
        }
        if (updateInvoiceDto.fundingProgramId) {
          invoiceData.fundingProgramId = BigInt(updateInvoiceDto.fundingProgramId);
        }
        
        // Remove items and itemsToRemove from invoiceData
        delete invoiceData.items;
        delete invoiceData.itemsToRemove;
        
        // Process item updates if provided and invoice is in DRAFT status or just updating status
        if (updateInvoiceDto.items && (invoice.status === InvoiceStatus.DRAFT || updateInvoiceDto.status)) {
          // Create or update each item
          for (const itemData of updateInvoiceDto.items) {
            if (itemData.id) {
              // Update existing item
              await prisma.invoiceItem.update({
                where: { id: BigInt(itemData.id) },
                data: {
                  serviceCodeId: itemData.serviceCodeId ? BigInt(itemData.serviceCodeId) : undefined,
                  description: itemData.description,
                  quantity: itemData.quantity,
                  rate: itemData.rate,
                  amount: itemData.quantity && itemData.rate ? itemData.quantity * itemData.rate : undefined,
                  dateOfService: itemData.dateOfService ? new Date(itemData.dateOfService) : undefined,
                  appointmentId: itemData.appointmentId ? BigInt(itemData.appointmentId) : undefined,
                  billToInsurance: itemData.billToInsurance,
                  notes: itemData.notes,
                },
              });
            } else {
              // Create new item
              await prisma.invoiceItem.create({
                data: {
                  invoiceId: id,
                  serviceCodeId: BigInt(itemData.serviceCodeId),
                  description: itemData.description,
                  quantity: itemData.quantity,
                  rate: itemData.rate,
                  amount: itemData.quantity * itemData.rate,
                  dateOfService: new Date(itemData.dateOfService),
                  appointmentId: itemData.appointmentId ? BigInt(itemData.appointmentId) : null,
                  billToInsurance: itemData.billToInsurance || false,
                  notes: itemData.notes,
                },
              });
            }
          }
        }
        
        // Remove items if specified
        if (updateInvoiceDto.itemsToRemove && invoice.status === InvoiceStatus.DRAFT) {
          for (const itemId of updateInvoiceDto.itemsToRemove) {
            await prisma.invoiceItem.delete({
              where: { id: BigInt(itemId) },
            });
          }
        }
        
        // Recalculate total amount based on updated items
        const updatedItems = await prisma.invoiceItem.findMany({
          where: { invoiceId: id },
        });
        
        const totalAmount = updatedItems.reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );
        
        // Update the invoice with new total
        invoiceData.totalAmount = totalAmount;
        
        // Update status based on payments
        if (updateInvoiceDto.status) {
          invoiceData.status = updateInvoiceDto.status;
        } else if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.CANCELLED) {
          // Calculate if partially paid or fully paid
          const amountPaid = invoice.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
          );
          
          invoiceData.amountPaid = amountPaid;
          
          if (amountPaid >= totalAmount) {
            invoiceData.status = InvoiceStatus.PAID;
          } else if (amountPaid > 0) {
            invoiceData.status = InvoiceStatus.PARTIALLY_PAID;
          } else if (new Date() > invoice.dueDate && invoice.status === InvoiceStatus.SENT) {
            invoiceData.status = InvoiceStatus.OVERDUE;
          }
        }
        
        // Update the invoice
        await prisma.invoice.update({
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
      this.logger.error(`Failed to update invoice with ID ${id}: ${error.message}`, error.stack);
      throw error;
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
      const invoice = await this.prisma.invoice.findUnique({
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
        await prisma.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });
        
        // Delete the invoice
        return prisma.invoice.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete invoice with ID ${id}: ${error.message}`, error.stack);
      throw error;
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
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });
    
    if (!lastInvoice) {
      // No invoices for this year yet
      return `${prefix}00001`;
    }
    
    // Extract the numeric part
    const lastNumber = parseInt(lastInvoice.invoiceNumber.substring(prefix.length), 10);
    const nextNumber = lastNumber + 1;
    
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
   * Get overdue invoices for notification
   * @returns List of overdue invoices that need notification
   */
  async getOverdueInvoices() {
    try {
      const today = new Date();
      
      return this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.SENT,
          dueDate: {
            lt: today,
          },
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch overdue invoices: ${error.message}`, error.stack);
      throw error;
    }
  }
}
