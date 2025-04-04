import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { Practice } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  // Assuming a single practice ID for now, replace with dynamic logic if needed
  private readonly practiceId = BigInt(1); 

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves billing information for the practice.
   * Assumes a single practice setup.
   * @returns {Promise<Partial<Practice>>} Selected billing fields from the practice.
   * @throws {NotFoundException} If the practice record is not found.
   */
  async getBillingInfo(): Promise<Partial<Practice> | object> {
    this.logger.log(`Fetching billing info for practice ID: ${this.practiceId}`);
    const practice = await this.prisma.practice.findUnique({
      where: { id: this.practiceId },
      select: {
        id: true,
        billingName: true,
        billingEmail: true,
        billingAddress: true,
        billingCity: true,
        billingState: true,
        billingZipCode: true,
        // Include Stripe fields if you want to display subscription status etc.
        // stripeCustomerId: true,
        // stripeSubscriptionId: true,
        // subscriptionStatus: true,
      },
    });

    if (!practice) {
      this.logger.warn(`Practice not found with ID: ${this.practiceId}. Returning empty template.`);
      // Return an empty billing template instead of throwing an exception
      return {
        billingName: '',
        billingEmail: '',
        billingAddress: '',
        billingCity: '',
        billingState: '',
        billingZipCode: ''
      };
    }
    this.logger.log(`Successfully retrieved billing info for practice ID: ${this.practiceId}`);
    return practice;
  }

  /**
   * Updates billing information for the practice.
   * Assumes a single practice setup.
   * @param {UpdateBillingDto} updateBillingDto - The DTO containing billing fields to update.
   * @returns {Promise<Partial<Practice>>} The updated billing fields.
   * @throws {NotFoundException} If the practice record is not found.
   */
  async updateBillingInfo(
    updateBillingDto: UpdateBillingDto,
  ): Promise<Partial<Practice>> {
    this.logger.log(`Updating billing info for practice ID: ${this.practiceId}`);
    try {
      const updatedPractice = await this.prisma.practice.update({
        where: { id: this.practiceId },
        data: {
          ...updateBillingDto,
          updatedAt: new Date(), // Explicitly set updatedAt
        },
        select: {
          id: true,
          billingName: true,
          billingEmail: true,
          billingAddress: true,
          billingCity: true,
          billingState: true,
          billingZipCode: true,
          updatedAt: true,
        },
      });
      this.logger.log(
        `Successfully updated billing info for practice ID: ${this.practiceId}`,
      );
      return updatedPractice;
    } catch (error: any) { 
      // Check if the error is due to the record not being found (P2025)
      if (error.code === 'P2025') {
        this.logger.error(
          `Update failed: Practice not found with ID: ${this.practiceId}`,
        );
        throw new NotFoundException(
          `Practice with ID ${this.practiceId} not found.`,
        );
      }
      this.logger.error(
        `Failed to update billing info for practice ID: ${this.practiceId}`,
        error?.stack, 
      );
      throw error; // Re-throw other errors
    }
  }
}
