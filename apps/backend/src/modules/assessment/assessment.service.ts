import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { Assessment } from './interfaces/assessment.interface';

/**
 * Service handling assessment-related business logic
 * 
 * Note: This is a temporary implementation since the assessment model
 * is not yet available in the Prisma schema
 */
@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);
  private assessments: Map<string, Assessment> = new Map();
  
  constructor(private readonly prismaService: PrismaService) {
    // Initialize with empty map
    this.logger.warn('Using temporary in-memory implementation for Assessments');
  }

  /**
   * Create a new assessment
   * @param createAssessmentDto - Data for creating the assessment
   * @param userId - ID of the user creating this assessment
   * @returns The created assessment
   */
  async create(createAssessmentDto: CreateAssessmentDto, userId: bigint) {
    // Check if client exists
    const client = await this.prismaService.clients.findUnique({
      where: { id: BigInt(createAssessmentDto.clientId) },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createAssessmentDto.clientId} not found`);
    }

    // Check if learner exists if learnerId is provided
    let learnerId: bigint | undefined;
    if (createAssessmentDto.learnerId) {
      const learner = await this.prismaService.learners.findUnique({
        where: { 
          id: BigInt(createAssessmentDto.learnerId),
          client_id: BigInt(createAssessmentDto.clientId),
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

    // Create the assessment (temporary in-memory implementation)
    const id = BigInt(Date.now());
    const assessment: Assessment = {
      id,
      assessmentType: createAssessmentDto.assessmentType,
      assessmentDate: new Date(createAssessmentDto.assessmentDate),
      evaluator: createAssessmentDto.evaluator,
      scores,
      summary: createAssessmentDto.summary,
      recommendations: createAssessmentDto.recommendations,
      notes: createAssessmentDto.notes,
      clientId: BigInt(createAssessmentDto.clientId),
      learnerId,
      createdAt: new Date(),
      createdBy: userId,
    };
    
    this.assessments.set(id.toString(), assessment);
    this.logger.log(`Created temporary assessment with ID: ${id}`);

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
    // Get all assessments (temporary in-memory implementation)
    const assessments = Array.from(this.assessments.values())
      .filter(a => a.clientId.toString() === clientId && 
        (!learnerId || a.learnerId?.toString() === learnerId) &&
        (!assessmentType || a.assessmentType === assessmentType))
      .sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
    
    this.logger.log(`Retrieved ${assessments.length} temporary assessments`);

    return assessments;
  }

  /**
   * Find an assessment by ID
   * @param id - Assessment ID
   * @returns The found assessment
   */
  async findOne(id: bigint) {
    // Get assessment by ID (temporary in-memory implementation)
    const assessment = this.assessments.get(id.toString());

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }
    
    this.logger.log(`Retrieved temporary assessment with ID: ${id}`);

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
    // Update assessment (temporary in-memory implementation)
    const existingAssessment = this.assessments.get(id.toString());
    if (!existingAssessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }
    
    const scores = updateAssessmentDto.scores 
      ? JSON.parse(updateAssessmentDto.scores) 
      : undefined;

    const updatedAssessment: Assessment = {
      ...existingAssessment,
      assessmentType: updateAssessmentDto.assessmentType || existingAssessment.assessmentType,
      assessmentDate: updateAssessmentDto.assessmentDate
        ? new Date(updateAssessmentDto.assessmentDate)
        : existingAssessment.assessmentDate,
      evaluator: updateAssessmentDto.evaluator || existingAssessment.evaluator,
      scores: scores || existingAssessment.scores,
      summary: updateAssessmentDto.summary ?? existingAssessment.summary,
      recommendations: updateAssessmentDto.recommendations ?? existingAssessment.recommendations,
      notes: updateAssessmentDto.notes ?? existingAssessment.notes,
      updatedBy: userId,
      updatedAt: new Date(),
    };
    
    this.assessments.set(id.toString(), updatedAssessment);
    this.logger.log(`Updated temporary assessment with ID: ${id}`);

    return updatedAssessment;
  }

  /**
   * Remove an assessment
   * @param id - Assessment ID
   * @returns The removed assessment
   */
  async remove(id: bigint) {
    // Delete assessment (temporary in-memory implementation)
    const deleted = this.assessments.delete(id.toString());
    
    if (!deleted) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }
    
    this.logger.log(`Deleted temporary assessment with ID: ${id}`);
    return { id: BigInt(id), deleted: true };
  }
}
