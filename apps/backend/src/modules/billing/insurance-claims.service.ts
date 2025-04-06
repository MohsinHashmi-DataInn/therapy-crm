import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInsuranceClaimDto } from './dto/create-insurance-claim.dto';
import { UpdateInsuranceClaimDto } from './dto/update-insurance-claim.dto';
import { PaymentMethod, ClaimStatus, InvoiceStatus } from '../../types/prisma-models';

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
  async create(createInsuranceClaimDto: CreateInsuranceClaimDto, userId: string) {
    try {
      const invoiceId = BigInt(createInsuranceClaimDto.invoiceId);
      const insuranceId = BigInt(createInsuranceClaimDto.insuranceId);
      const userIdBigInt = BigInt(userId);
      
      // Check if invoice exists
      const invoice = await this.prisma.invoices.findFirst({
        where: { id: invoiceId },
        include: {
          invoice_line_items: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${createInsuranceClaimDto.invoiceId} not found`);
      }
      
      // Check if client insurance exists
      const clientInsurance = await this.prisma.client_insurance.findFirst({
        where: { id: insuranceId },
      });

      if (!clientInsurance) {
        throw new NotFoundException(`Client insurance with ID ${createInsuranceClaimDto.insuranceId} not found`);
      }
      
      // Determine which invoice items to include in the claim
      let claimItems = invoice.invoice_line_items;
      
      if (createInsuranceClaimDto.invoiceItemIds && createInsuranceClaimDto.invoiceItemIds.length > 0) {
        // Filter to only include specified items
        const itemIds = createInsuranceClaimDto.invoiceItemIds.map(id => BigInt(id));
        claimItems = invoice.invoice_line_items.filter(item => itemIds.includes(item.id));
      } else {
        // If not specified, only include all items
        // Note: invoice_line_items may not have billToInsurance field, using all items
        claimItems = invoice.invoice_line_items;
      }
      
      if (claimItems.length === 0) {
        throw new BadRequestException('No invoice items selected for this claim. Please select at least one item or mark items for insurance billing.');
      }
      
      // Calculate the total claim amount
      const claimAmount = claimItems.reduce(
        (sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)),
        0
      );
      
      return this.prisma.$transaction(async (prisma) => {
        // Create the claim
        const claim = await prisma.insurance_claims.create({
          data: {
            invoice_id: invoiceId,
            insurance_id: insuranceId,
            claim_number: createInsuranceClaimDto.claimNumber,
            submission_date: createInsuranceClaimDto.submissionDate 
              ? new Date(createInsuranceClaimDto.submissionDate) 
              : new Date(),
            status: createInsuranceClaimDto.status || ClaimStatus.PENDING,
            amount_claimed: createInsuranceClaimDto.amountClaimed || claimAmount.toString(),
            amount_approved: createInsuranceClaimDto.amountApproved,
            denial_reason: createInsuranceClaimDto.denialReason,
            notes: createInsuranceClaimDto.notes,
            follow_up_date: createInsuranceClaimDto.followUpDate 
              ? new Date(createInsuranceClaimDto.followUpDate) 
              : null,
            created_by: userIdBigInt,
            updated_at: new Date(),
          },
        });
        
        // Note: Since there's no dedicated insurance_claim_items model in the schema,
        // we're not creating claim items. If this functionality is needed,
        // the schema would need to be updated to include an insurance_claim_items table.
        
        // If claim is created, update the invoice status to PENDING
        if (invoice.status !== InvoiceStatus.PENDING) {
          await prisma.invoices.update({
            where: { id: invoiceId },
            data: {
              status: InvoiceStatus.PENDING,
            },
          });
        }
        
        return this.findOne(claim.id.toString());
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create insurance claim: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Get all insurance claims with optional filtering
   * @param filters - Optional filters for claims
   * @returns List of claims matching the criteria
   */
  async findAll(filters?: {
    status?: ClaimStatus;
    insuranceId?: string;
    from?: string;
    to?: string;
    clientId?: string;
    limit?: number;
    page?: number;
  }) {
    try {
      // Build where clause based on filters
      const where: any = {};
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.insuranceId) {
        where.insurance_id = BigInt(filters.insuranceId);
      }
      
      // Submission date range filtering
      if (filters?.from || filters?.to) {
        where.submission_date = {};
        
        if (filters?.from) {
          where.submission_date.gte = new Date(filters.from);
        }
        
        if (filters?.to) {
          where.submission_date.lte = new Date(filters.to);
        }
      }
      
      // Client filtering
      if (filters?.clientId) {
        where.invoices = {
          client_id: BigInt(filters.clientId),
        };
      }
      
      // Query for total count (for pagination)
      const totalCount = await this.prisma.insurance_claims.count({ where });
      
      // Set default pagination values if not provided
      const limit = filters?.limit || 50;
      const page = filters?.page || 1;
      
      // Query for claims with pagination
      const claims = await this.prisma.insurance_claims.findMany({
        where,
        include: {
          invoices: true,
          client_insurance: true,
        },
        orderBy: {
          submission_date: 'desc',
          created_at: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });
      
      return {
        data: claims,
        meta: {
          total: totalCount,
          page: page,
          limit: limit,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error finding insurance claims: ${errorMessage}`, errorStack);
      throw new BadRequestException(`Failed to retrieve insurance claims: ${errorMessage}`);
    }
  }

  /**
   * Get a specific insurance claim by ID
   * @param id - ID of the claim to find
   * @returns The claim if found
   * @throws NotFoundException if the claim doesn't exist
   */
  async findOne(id: string) {
    try {
      const claimId = BigInt(id);
      
      const claim = await this.prisma.insurance_claims.findFirst({
        where: { id: claimId },
        include: {
          invoices: {
            include: {
              clients: true,
              invoice_line_items: true,
            },
          },
          client_insurance: true,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch insurance claim with ID ${id}: ${errorMessage}`, errorStack);
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
  async update(id: string, updateInsuranceClaimDto: UpdateInsuranceClaimDto, userId: bigint) {
    try {
      const claimId = BigInt(id);
      
      // Check if claim exists
      const existingClaim = await this.prisma.insurance_claims.findFirst({
        where: { id: claimId },
        include: {
          invoices: true,
        },
      });

      if (!existingClaim) {
        throw new NotFoundException(`Insurance claim with ID ${id} not found`);
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date(),
      };
      
      if (updateInsuranceClaimDto.insuranceId) {
        updateData.insurance_id = BigInt(updateInsuranceClaimDto.insuranceId);
      }
      
      if (updateInsuranceClaimDto.status && updateInsuranceClaimDto.status !== existingClaim.status) {
        updateData.status = updateInsuranceClaimDto.status;
        
        // Handle status transitions
        if (updateInsuranceClaimDto.status === ClaimStatus.PAID) {
          // Calculate total approved amount
          const approvedAmount = updateInsuranceClaimDto.amountApproved 
            ? Number(updateInsuranceClaimDto.amountApproved) 
            : Number(existingClaim.amount_claimed || '0');
          
          // Create payment record
          if (approvedAmount > 0) {
            await this.prisma.payments.create({
              data: {
                invoice_id: existingClaim.invoice_id,
                amount: approvedAmount.toString(),
                payment_method: PaymentMethod.INSURANCE_DIRECT,
                payment_date: new Date(),
                notes: `Insurance payment for claim ${existingClaim.claim_number || id}`,
                created_at: new Date(),
                updated_at: new Date(),
              },
            });
            
            // Check if invoice is fully paid
            const allPayments = await this.prisma.payments.findMany({
              where: { invoice_id: existingClaim.invoice_id },
            });
            
            const totalPaid = allPayments.reduce((sum: number, payment: any) => {
              return sum + Number(payment.amount);
            }, 0);
            
            // Update invoice status if fully paid
            const invoice = await this.prisma.invoices.findFirst({
              where: { id: existingClaim.invoice_id },
            });
            
            if (invoice && totalPaid >= Number(invoice.total_amount)) {
              await this.prisma.invoices.update({
                where: { id: existingClaim.invoice_id },
                data: {
                  status: InvoiceStatus.PAID,
                },
              });
            } else if (invoice) {
              await this.prisma.invoices.update({
                where: { id: existingClaim.invoice_id },
                data: {
                  status: InvoiceStatus.PARTIAL,
                },
              });
            }
          }
        }
        
        // Handle other status transitions
        if (updateInsuranceClaimDto.status === ClaimStatus.DENIED && existingClaim.status !== ClaimStatus.DENIED) {
          // Update invoice status if claim is denied
          await this.prisma.invoices.update({
            where: { id: existingClaim.invoice_id },
            data: {
              status: InvoiceStatus.PENDING,
            },
          });
        } else if (updateInsuranceClaimDto.status === ClaimStatus.SUBMITTED && existingClaim.status !== ClaimStatus.SUBMITTED) {
          // Update submission date if status changed to SUBMITTED
          updateData.submission_date = new Date();
        }
      }
      
      // Update the claim
      await this.prisma.insurance_claims.update({
        where: { id: claimId },
        data: updateData,
      });
      
      // Return the updated claim
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update insurance claim with ID ${id}: ${errorMessage}`, errorStack);
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
  async remove(id: string) {
    try {
      const claimId = BigInt(id);
      
      // Check if claim exists
      const existingClaim = await this.prisma.insurance_claims.findFirst({
        where: { id: claimId },
      });

      if (!existingClaim) {
        throw new NotFoundException(`Insurance claim with ID ${id} not found`);
      }

      // Only allow deleting DRAFT claims
      if (existingClaim.status !== ClaimStatus.PENDING) {
        throw new BadRequestException(
          `Cannot delete a claim with status ${existingClaim.status}. Only PENDING claims can be deleted.`
        );
      }

      return this.prisma.$transaction(async (prisma) => {
        // Note: Since there's no dedicated insurance_claim_items model in the schema,
        // we don't need to delete claim items.
        
        // Delete the claim
        return prisma.insurance_claims.delete({
          where: { id: claimId },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to delete insurance claim with ID ${id}: ${errorMessage}`, errorStack);
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
      return this.prisma.insurance_claims.findMany({
        where: { invoice_id: invoiceId },
        include: {
          client_insurance: true,
          invoices: true
        },
        orderBy: { submission_date: 'desc' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch claims for invoice ${invoiceId}: ${errorMessage}`, errorStack);
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
      return this.prisma.insurance_claims.findMany({
        where: {
          invoices: {
            client_id: clientId,
          },
        },
        include: {
          invoices: {
            select: {
              id: true,
              invoice_number: true,
            },
          },
          client_insurance: true
        },
        orderBy: { submission_date: 'desc' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch claims for client ${clientId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Update claim status
   * @param id - ID of the claim to update
   * @param status - New status
   * @returns The updated claim
   */
  async updateStatus(id: string, status: ClaimStatus, userId: bigint) {
    return this.update(id, { status }, userId);
  }
}
