import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service'; 
import { Practice } from '@prisma/client';
import { UpdatePracticeDto } from './dto/update-practice.dto';

@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);
  // Assuming the single practice record always has ID 1
  private readonly practiceId = BigInt(1);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the practice information.
   * Assumes there is only one practice record (ID: 1).
   * @returns {Promise<Practice>} The practice details.
   * @throws {NotFoundException} If the practice record is not found.
   */
  async getPracticeInfo(): Promise<Practice> {
    this.logger.log(`Fetching practice info for ID: ${this.practiceId}`);
    const practice = await this.prisma.practice.findUnique({
      where: { id: this.practiceId },
    });

    if (!practice) {
      this.logger.warn(`Practice information not found for ID: ${this.practiceId}. Consider initializing.`);
      // You might want to return a default object or create one if it doesn't exist.
      // For now, we throw an error.
      throw new NotFoundException(`Practice information not found. Please ensure it is initialized.`);
    }
    return practice;
  }

  /**
   * Updates the practice information.
   * Assumes there is only one practice record (ID: 1).
   * @param {UpdatePracticeDto} updatePracticeDto - The data transfer object containing the fields to update.
   * @returns {Promise<Practice>} The updated practice details.
   * @throws {NotFoundException} If the practice record is not found.
   */
  async updatePracticeInfo(updatePracticeDto: UpdatePracticeDto): Promise<Practice> {
    this.logger.log(`Updating practice info for ID: ${this.practiceId}`);
    try {
      const updatedPractice = await this.prisma.practice.update({
        where: { id: this.practiceId },
        data: updatePracticeDto,
      });
      this.logger.log(`Successfully updated practice info for ID: ${this.practiceId}`);
      return updatedPractice;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error updating practice info for ID: ${this.practiceId}`, error.stack);
      } else {
        this.logger.error(`An unknown error occurred while updating practice info for ID: ${this.practiceId}`, error);
      }

      // Check if the error is due to the record not being found
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException(`Practice with ID ${this.practiceId} not found.`);
      }
      throw error; // Re-throw other errors
    }
  }

 // Optional: Method to initialize/create the first practice record if needed
 // Call this during application startup or via a seeding script if desired.
 async initializePractice(data: { name: string, /* other required fields like email/phone? */ }): Promise<Practice> {
     this.logger.log(`Initializing or updating practice info for ID: ${this.practiceId}`);
     return this.prisma.practice.upsert({
       where: { id: this.practiceId },
       update: data, // Update if exists
       create: { ...data, id: this.practiceId }, // Create if not exists, ensuring ID is set
     });
 }
}
