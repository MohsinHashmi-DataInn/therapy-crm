import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInsuranceClaimDto, ClaimStatus } from './dto/create-insurance-claim.dto';
import { UpdateInsuranceClaimDto } from './dto/update-insurance-claim.dto';
import { PaymentMethod } from './dto/create-payment.dto';
import { InvoiceStatus } from './dto/create-invoice.dto';

/**
 * Service for managing insurance claims
 * Handles CRUD operations for insurance claims and related invoice items
 */
@Injectable()
export class InsuranceClaimsService {
  private readonly logger = new Logger(InsuranceClaimsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new insurance claim
   * @param createInsuranceClaimDto - Data for creating the insurance claim
   * @param userId - ID of the user creating the claim
   * @returns The created insurance claim
   * @throws NotFoundException if the invoice or insurance provider doesn't exist
   * @throws BadRequestException if the invoice has no items to claim
   */
  async create(createInsuranceClaimDto: CreateInsuranceClaimDto, userId: bigint) {
    try {
      const invoiceId = BigInt(createInsuranceClaimDto.invoiceId);
      const insuranceProviderId = BigInt(createInsuranceClaimDto.insuranceProviderId);
      
      // Check if invoice exists
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${createInsuranceClaimDto.invoiceId} not found`);
      }
      
      // Check if insurance provider exists
      const insuranceProvider = await this.prisma.insuranceProvider.findUnique({
        where: { id: insuranceProviderId },
      });

      if (!insuranceProvider) {
        throw new NotFoundException(`Insurance provider with ID ${createInsuranceClaimDto.insuranceProviderId} not found`);
      }
      
      // Determine which invoice items to include in the claim
      let claimItems = invoice.items;
      
      if (createInsuranceClaimDto.invoiceItemIds && createInsuranceClaimDto.invoiceItemIds.length > 0) {
        // Filter to only include specified items
        const itemIds = createInsuranceClaimDto.invoiceItemIds.map(id => BigInt(id));
        claimItems = invoice.items.filter(item => itemIds.includes(item.id));
      } else {
        // If not specified, only include items marked for insurance billing
        claimItems = invoice.items.filter(item => item.billToInsurance);
      }
      
      if (claimItems.length === 0) {
        throw new BadRequestException('No invoice items selected for this claim. Please select at least one item or mark items for insurance billing.');
      }
      
      // Calculate the total claim amount
      const claimAmount = claimItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
      
      return this.prisma.$transaction(async (prisma) => {
        // Create the claim
        const claim = await prisma.insuranceClaim.create({
          data: {
            invoiceId,
            insuranceProviderId,
            policyNumber: createInsuranceClaimDto.policyNumber,
            beneficiaryName: createInsuranceClaimDto.beneficiaryName,
            submissionDate: createInsuranceClaimDto.submissionDate 
              ? new Date(createInsuranceClaimDto.submissionDate) 
              : undefined,
            status: createInsuranceClaimDto.status || ClaimStatus.DRAFT,
            claimNumber: createInsuranceClaimDto.claimNumber,
            notes: createInsuranceClaimDto.notes,
            claimAmount,
            autoGeneratePayment: createInsuranceClaimDto.autoGeneratePayment ?? true,
            createdById: userId,
          },
        });
        
        // Associate invoice items with the claim
        for (const item of claimItems) {
          await prisma.insuranceClaimItem.create({
            data: {
              claimId: claim.id,
              invoiceItemId: item.id,
              claimedAmount: Number(item.amount),
            },
          });
        }
        
        // If status is not DRAFT, update the invoice status to PENDING_INSURANCE
        if (claim.status !== ClaimStatus.DRAFT && invoice.status !== InvoiceStatus.PENDING_INSURANCE) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: InvoiceStatus.PENDING_INSURANCE,
            },
          });
        }
        
        return this.findOne(claim.id);
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create insurance claim: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all insurance claims with optional filtering
   * @param filters - Optional filters for claims
   * @returns List of claims matching the criteria
   */
  async findAll(filters: {
    status?: ClaimStatus;
    insuranceProviderId?: string;
    from?: string;
    to?: string;
    clientId?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Build where clause based on filters
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.insuranceProviderId) {
        where.insuranceProviderId = BigInt(filters.insuranceProviderId);
      }
      
      // Submission date range filtering
      if (filters.from || filters.to) {
        where.submissionDate = {};
        if (filters.from) {
          where.submissionDate.gte = new Date(filters.from);
        }
        if (filters.to) {
          where.submissionDate.lte = new Date(filters.to);
        }
      }
      
      // Filter by client ID
      if (filters.clientId) {
        where.invoice = {
          clientId: BigInt(filters.clientId),
        };
      }
      
      // Query for total count (for pagination)
      const totalCount = await this.prisma.insuranceClaim.count({ where });
      
      // Set default pagination values if not provided
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      // Query for claims with pagination
      const claims = await this.prisma.insuranceClaim.findMany({
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
          insuranceProvider: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: [
          { submissionDate: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      });
      
      return {
        totalCount,
        claims,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch insurance claims: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific insurance claim by ID
   * @param id - ID of the claim to find
   * @returns The claim if found
   * @throws NotFoundException if the claim doesn't exist
   */
  async findOne(id: bigint) {
    try {
      const claim = await this.prisma.insuranceClaim.findUnique({
        where: { id },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              clientId: true,
              totalAmount: true,
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                  address: true,
                },
              },
            },
          },
          insuranceProvider: true,
          items: {
            include: {
              invoiceItem: {
                include: {
                  serviceCode: true,
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

      if (!claim) {
        throw new NotFoundException(`Insurance claim with ID ${id} not found`);
      }

      return claim;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch insurance claim with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an insurance claim
   * @param id - ID of the claim to update
   * @param updateInsuranceClaimDto - Data for updating the claim
   * @returns The updated claim
   * @throws NotFoundException if the claim doesn't exist
   * @throws BadRequestException if trying to modify a submitted claim
   */
  async update(id: bigint, updateInsuranceClaimDto: UpdateInsuranceClaimDto) {
    try {
      // Check if claim exists
      const claim = await this.prisma.insuranceClaim.findUnique({
        where: { id },
        include: {
          invoice: {
            include: {
              items: true,
            },
          },
          items: {
            include: {
              invoiceItem: true,
            },
          },
        },
      });

      if (!claim) {
        throw new NotFoundException(`Insurance claim with ID ${id} not found`);
      }

      // Check if trying to modify items for a submitted claim
      if (
        claim.status !== ClaimStatus.DRAFT && 
        !updateInsuranceClaimDto.status &&
        (updateInsuranceClaimDto.invoiceItemsToAdd || updateInsuranceClaimDto.invoiceItemsToRemove)
      ) {
        throw new BadRequestException(
          `Cannot modify items for a claim with status ${claim.status}. Change status to DRAFT first or only update the status.`
        );
      }

      return this.prisma.$transaction(async (prisma) => {
        // Process claim updates
        let claimData: any = { ...updateInsuranceClaimDto };
        
        // Convert date strings to Date objects
        if (updateInsuranceClaimDto.submissionDate) {
          claimData.submissionDate = new Date(updateInsuranceClaimDto.submissionDate);
        }
        if (updateInsuranceClaimDto.responseDate) {
          claimData.responseDate = new Date(updateInsuranceClaimDto.responseDate);
        }
        
        // Convert string IDs to BigInt
        if (updateInsuranceClaimDto.insuranceProviderId) {
          claimData.insuranceProviderId = BigInt(updateInsuranceClaimDto.insuranceProviderId);
        }
        
        // Remove properties that shouldn't be directly updated
        delete claimData.invoiceItemsToAdd;
        delete claimData.invoiceItemsToRemove;
        
        // Process item updates if provided and claim is in DRAFT status
        if (claim.status === ClaimStatus.DRAFT) {
          // Add new items to the claim
          if (updateInsuranceClaimDto.invoiceItemsToAdd && updateInsuranceClaimDto.invoiceItemsToAdd.length > 0) {
            const itemIdsToAdd = updateInsuranceClaimDto.invoiceItemsToAdd.map(id => BigInt(id));
            
            // Filter out items that are already in the claim
            const existingItemIds = claim.items.map(item => item.invoiceItemId);
            const newItemIds = itemIdsToAdd.filter(id => !existingItemIds.includes(id));
            
            // Check if items belong to the invoice
            const invoiceItemIds = claim.invoice.items.map(item => item.id);
            const invalidItemIds = newItemIds.filter(id => !invoiceItemIds.includes(id));
            
            if (invalidItemIds.length > 0) {
              throw new BadRequestException(`Some invoice items do not belong to this invoice: ${invalidItemIds.join(', ')}`);
            }
            
            // Add new items
            for (const itemId of newItemIds) {
              const invoiceItem = claim.invoice.items.find(item => item.id === itemId);
              await prisma.insuranceClaimItem.create({
                data: {
                  claimId: id,
                  invoiceItemId: itemId,
                  claimedAmount: Number(invoiceItem.amount),
                },
              });
            }
          }
          
          // Remove items from the claim
          if (updateInsuranceClaimDto.invoiceItemsToRemove && updateInsuranceClaimDto.invoiceItemsToRemove.length > 0) {
            const itemIdsToRemove = updateInsuranceClaimDto.invoiceItemsToRemove.map(id => BigInt(id));
            
            for (const itemId of itemIdsToRemove) {
              // Find the claim item
              const claimItem = claim.items.find(item => item.invoiceItemId === itemId);
              
              if (claimItem) {
                await prisma.insuranceClaimItem.delete({
                  where: { id: claimItem.id },
                });
              }
            }
          }
        }
        
        // Recalculate claim amount based on updated items
        const updatedItems = await prisma.insuranceClaimItem.findMany({
          where: { claimId: id },
          include: {
            invoiceItem: true,
          },
        });
        
        const claimAmount = updatedItems.reduce(
          (sum, item) => sum + Number(item.invoiceItem.amount),
          0
        );
        
        claimData.claimAmount = claimAmount;
        
        // Handle status updates and payment creation
        const oldStatus = claim.status;
        const newStatus = updateInsuranceClaimDto.status || oldStatus;
        
        // If status changed to PAID and auto-generate payment is enabled
        if (
          oldStatus !== ClaimStatus.PAID && 
          newStatus === ClaimStatus.PAID && 
          claim.autoGeneratePayment &&
          updateInsuranceClaimDto.paidAmount
        ) {
          // Create a payment
          await prisma.payment.create({
            data: {
              invoiceId: claim.invoiceId,
              amount: updateInsuranceClaimDto.paidAmount,
              date: new Date(),
              method: PaymentMethod.INSURANCE,
              referenceNumber: claim.claimNumber,
              notes: `Auto-generated payment from insurance claim ${id}`,
              insuranceClaimId: String(id),
              createdById: claim.createdById,
            },
          });
          
          // Calculate new amount paid for invoice
          const allPayments = await prisma.payment.findMany({
            where: { invoiceId: claim.invoiceId },
          });
          
          const amountPaid = allPayments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
          );
          
          // Update invoice status based on payment
          let invoiceStatus: InvoiceStatus;
          
          if (amountPaid >= Number(claim.invoice.totalAmount)) {
            invoiceStatus = InvoiceStatus.PAID;
          } else if (amountPaid > 0) {
            invoiceStatus = InvoiceStatus.PARTIALLY_PAID;
          } else {
            invoiceStatus = InvoiceStatus.SENT;
          }
          
          await prisma.invoice.update({
            where: { id: claim.invoiceId },
            data: {
              amountPaid,
              status: invoiceStatus,
            },
          });
        } 
        // If status changed to DENIED
        else if (
          oldStatus !== ClaimStatus.DENIED && 
          newStatus === ClaimStatus.DENIED
        ) {
          // Update invoice status to INSURANCE_DENIED
          await prisma.invoice.update({
            where: { id: claim.invoiceId },
            data: {
              status: InvoiceStatus.INSURANCE_DENIED,
            },
          });
        }
        // If status changed to a submitted status
        else if (
          oldStatus === ClaimStatus.DRAFT && 
          newStatus !== ClaimStatus.DRAFT
        ) {
          // Update invoice status to PENDING_INSURANCE
          await prisma.invoice.update({
            where: { id: claim.invoiceId },
            data: {
              status: InvoiceStatus.PENDING_INSURANCE,
            },
          });
        }
        
        // Update the claim
        await prisma.insuranceClaim.update({
          where: { id },
          data: claimData,
        });
        
        // Return the updated claim
        return this.findOne(id);
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update insurance claim with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an insurance claim
   * @param id - ID of the claim to delete
   * @returns The deleted claim
   * @throws NotFoundException if the claim doesn't exist
   * @throws BadRequestException if trying to delete a submitted claim
   */
  async remove(id: bigint) {
    try {
      // Check if claim exists
      const claim = await this.prisma.insuranceClaim.findUnique({
        where: { id },
      });

      if (!claim) {
        throw new NotFoundException(`Insurance claim with ID ${id} not found`);
      }

      // Only allow deleting DRAFT claims
      if (claim.status !== ClaimStatus.DRAFT) {
        throw new BadRequestException(
          `Cannot delete a claim with status ${claim.status}. Only DRAFT claims can be deleted.`
        );
      }

      return this.prisma.$transaction(async (prisma) => {
        // Delete all claim items
        await prisma.insuranceClaimItem.deleteMany({
          where: { claimId: id },
        });
        
        // Delete the claim
        return prisma.insuranceClaim.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete insurance claim with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get claims for a specific invoice
   * @param invoiceId - ID of the invoice
   * @returns List of claims for the invoice
   */
  async findByInvoiceId(invoiceId: bigint) {
    try {
      return this.prisma.insuranceClaim.findMany({
        where: { invoiceId },
        include: {
          insuranceProvider: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { submissionDate: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch claims for invoice ${invoiceId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get claims for a specific client
   * @param clientId - ID of the client
   * @returns List of claims for the client
   */
  async findByClientId(clientId: bigint) {
    try {
      return this.prisma.insuranceClaim.findMany({
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
          insuranceProvider: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { submissionDate: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch claims for client ${clientId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update claim status
   * @param id - ID of the claim to update
   * @param status - New status
   * @returns The updated claim
   */
  async updateStatus(id: bigint, status: ClaimStatus) {
    return this.update(id, { status });
  }
}
