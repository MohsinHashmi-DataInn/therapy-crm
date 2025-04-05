import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

/**
 * Service handling assessment-related business logic
 */
@Injectable()
export class AssessmentService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new assessment
   * @param createAssessmentDto - Data for creating the assessment
   * @param userId - ID of the user creating this assessment
   * @returns The created assessment
   */
  async create(createAssessmentDto: CreateAssessmentDto, userId: bigint) {
    // Check if client exists
    const client = await this.prismaService.client.findUnique({
      where: { id: BigInt(createAssessmentDto.clientId) },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createAssessmentDto.clientId} not found`);
    }

    // Check if learner exists if learnerId is provided
    let learnerId: bigint | undefined;
    if (createAssessmentDto.learnerId) {
      const learner = await this.prismaService.learner.findUnique({
        where: { 
          id: BigInt(createAssessmentDto.learnerId),
          clientId: BigInt(createAssessmentDto.clientId),
        },
      });

      if (!learner) {
        throw new NotFoundException(`Learner with ID ${createAssessmentDto.learnerId} not found for this client`);
      }

      learnerId = BigInt(createAssessmentDto.learnerId);
    }

    // Parse JSON scores if provided
    const scores = createAssessmentDto.scores 
      ? JSON.parse(createAssessmentDto.scores) 
      : undefined;

    // Create the assessment
    const assessment = await this.prismaService.assessment.create({
      data: {
        assessmentType: createAssessmentDto.assessmentType,
        assessmentDate: new Date(createAssessmentDto.assessmentDate),
        evaluator: createAssessmentDto.evaluator,
        scores,
        summary: createAssessmentDto.summary,
        recommendations: createAssessmentDto.recommendations,
        notes: createAssessmentDto.notes,
        clientId: BigInt(createAssessmentDto.clientId),
        learnerId,
        createdBy: userId,
      },
    });

    return assessment;
  }

  /**
   * Find all assessments with optional filtering
   * @param clientId - Optional client ID filter
   * @param learnerId - Optional learner ID filter
   * @param assessmentType - Optional assessment type filter
   * @returns Array of assessments
   */
  async findAll(clientId?: string, learnerId?: string, assessmentType?: string) {
    const where: any = {};

    // Add filters if provided
    if (clientId) {
      where.clientId = BigInt(clientId);
    }

    if (learnerId) {
      where.learnerId = BigInt(learnerId);
    }

    if (assessmentType) {
      where.assessmentType = assessmentType;
    }

    const assessments = await this.prismaService.assessment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        assessmentDate: 'desc',
      },
    });

    return assessments;
  }

  /**
   * Find an assessment by ID
   * @param id - Assessment ID
   * @returns The found assessment
   */
  async findOne(id: bigint) {
    const assessment = await this.prismaService.assessment.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  /**
   * Update an assessment
   * @param id - Assessment ID
   * @param updateAssessmentDto - Data for updating the assessment
   * @param userId - ID of the user updating this assessment
   * @returns The updated assessment
   */
  async update(
    id: bigint,
    updateAssessmentDto: UpdateAssessmentDto,
    userId: bigint,
  ) {
    // Check if assessment exists
    await this.findOne(id);

    // Prepare learner ID if provided
    let learnerId: bigint | undefined;
    if (updateAssessmentDto.learnerId) {
      learnerId = BigInt(updateAssessmentDto.learnerId);
    }

    // Prepare client ID if provided
    let clientId: bigint | undefined;
    if (updateAssessmentDto.clientId) {
      clientId = BigInt(updateAssessmentDto.clientId);
    }

    // Parse JSON scores if provided
    const scores = updateAssessmentDto.scores 
      ? JSON.parse(updateAssessmentDto.scores) 
      : undefined;

    // Prepare assessment date if provided
    let assessmentDate: Date | undefined;
    if (updateAssessmentDto.assessmentDate) {
      assessmentDate = new Date(updateAssessmentDto.assessmentDate);
    }

    // Update the assessment
    const updatedAssessment = await this.prismaService.assessment.update({
      where: { id },
      data: {
        assessmentType: updateAssessmentDto.assessmentType,
        assessmentDate,
        evaluator: updateAssessmentDto.evaluator,
        scores,
        summary: updateAssessmentDto.summary,
        recommendations: updateAssessmentDto.recommendations,
        notes: updateAssessmentDto.notes,
        clientId,
        learnerId,
        updatedBy: userId,
      },
    });

    return updatedAssessment;
  }

  /**
   * Remove an assessment
   * @param id - Assessment ID
   * @returns The removed assessment
   */
  async remove(id: bigint) {
    // Check if assessment exists
    await this.findOne(id);

    // Remove the assessment
    return this.prismaService.assessment.delete({
      where: { id },
    });
  }
}
