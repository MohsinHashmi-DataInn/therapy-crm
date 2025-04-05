import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTreatmentPlanDto, PlanStatus, ApprovalStatus } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';

/**
 * Service handling treatment plan-related business logic
 */
@Injectable()
export class TreatmentPlanService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new treatment plan with optional goals and interventions
   * @param createTreatmentPlanDto - Data for creating the treatment plan
   * @param userId - ID of the user creating this plan
   * @returns The created treatment plan with its goals and interventions
   */
  async create(createTreatmentPlanDto: CreateTreatmentPlanDto, userId: bigint) {
    // Check if client exists
    const client = await this.prismaService.client.findUnique({
      where: { id: BigInt(createTreatmentPlanDto.clientId) },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createTreatmentPlanDto.clientId} not found`);
    }

    // Check if learner exists if learnerId is provided
    let learnerId: bigint | undefined;
    if (createTreatmentPlanDto.learnerId) {
      const learner = await this.prismaService.learner.findUnique({
        where: { 
          id: BigInt(createTreatmentPlanDto.learnerId),
          clientId: BigInt(createTreatmentPlanDto.clientId),
        },
      });

      if (!learner) {
        throw new NotFoundException(`Learner with ID ${createTreatmentPlanDto.learnerId} not found for this client`);
      }

      learnerId = BigInt(createTreatmentPlanDto.learnerId);
    }

    // Convert date strings to Date objects
    const startDate = new Date(createTreatmentPlanDto.startDate);
    const endDate = new Date(createTreatmentPlanDto.endDate);
    
    // Validate date ranges
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    let reviewDate: Date | undefined;
    if (createTreatmentPlanDto.reviewDate) {
      reviewDate = new Date(createTreatmentPlanDto.reviewDate);
      
      if (reviewDate <= startDate || reviewDate >= endDate) {
        throw new BadRequestException('Review date must be between start and end dates');
      }
    }

    // Parse assessment IDs if provided
    const assessmentIds = createTreatmentPlanDto.assessmentIds 
      ? createTreatmentPlanDto.assessmentIds.map(id => BigInt(id))
      : [];

    // Create the treatment plan with nested goals and interventions
    const treatmentPlan = await this.prismaService.treatmentPlan.create({
      data: {
        title: createTreatmentPlanDto.title,
        description: createTreatmentPlanDto.description,
        startDate,
        endDate,
        reviewDate,
        status: createTreatmentPlanDto.status,
        approvalStatus: createTreatmentPlanDto.approvalStatus,
        approvalNotes: createTreatmentPlanDto.approvalNotes,
        assessmentSummary: createTreatmentPlanDto.assessmentSummary,
        clientId: BigInt(createTreatmentPlanDto.clientId),
        learnerId,
        createdBy: userId,
        
        // Create goals if provided
        goals: createTreatmentPlanDto.goals ? {
          create: createTreatmentPlanDto.goals.map(goal => ({
            domain: goal.domain,
            description: goal.description,
            longTermObjective: goal.longTermObjective,
            shortTermObjectives: goal.shortTermObjectives,
            priority: goal.priority,
            masteryConditions: goal.masteryConditions,
            baselinePerformance: goal.baselinePerformance,
            baselineNotes: goal.baselineNotes,
            instructionalStrategies: goal.instructionalStrategies,
            createdBy: userId,
          })),
        } : undefined,
        
        // Create interventions if provided
        interventions: createTreatmentPlanDto.interventions ? {
          create: createTreatmentPlanDto.interventions.map(intervention => ({
            interventionType: intervention.interventionType,
            title: intervention.title,
            description: intervention.description,
            sessionDuration: intervention.sessionDuration,
            sessionFrequency: intervention.sessionFrequency,
            customFrequencyDetails: intervention.customFrequencyDetails,
            totalSessions: intervention.totalSessions,
            materialsRequired: intervention.materialsRequired,
            dataCollectionMethod: intervention.dataCollectionMethod,
            createdBy: userId,
          })),
        } : undefined,
      },
      include: {
        goals: true,
        interventions: true,
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
    });

    // Connect assessments if provided
    if (assessmentIds.length > 0) {
      await Promise.all(assessmentIds.map(assessmentId => 
        this.prismaService.treatmentPlanAssessment.create({
          data: {
            treatmentPlanId: treatmentPlan.id,
            assessmentId,
          },
        })
      ));
    }

    // Connect goals to interventions if specified in the interventions
    if (createTreatmentPlanDto.interventions) {
      const createdInterventions = treatmentPlan.interventions;
      const createdGoals = treatmentPlan.goals;

      for (let i = 0; i < createTreatmentPlanDto.interventions.length; i++) {
        const intervention = createTreatmentPlanDto.interventions[i];
        const createdIntervention = createdInterventions[i];

        if (intervention.goalIds && intervention.goalIds.length > 0) {
          // Map goal indexes to created goal IDs
          const goalIndexes = intervention.goalIds.map(goalId => parseInt(goalId, 10));
          
          // Create connections for valid indexes
          await Promise.all(goalIndexes.map(async (index) => {
            if (index >= 0 && index < createdGoals.length) {
              const goalId = createdGoals[index].id;
              await this.prismaService.interventionGoal.create({
                data: {
                  interventionId: createdIntervention.id,
                  goalId,
                },
              });
            }
          }));
        }
      }
    }

    // Return the complete treatment plan with all relationships
    return this.findOne(treatmentPlan.id);
  }

  /**
   * Find all treatment plans with optional filtering
   * @param clientId - Optional client ID filter
   * @param learnerId - Optional learner ID filter
   * @param status - Optional status filter
   * @param approvalStatus - Optional approval status filter
   * @returns Array of treatment plans
   */
  async findAll(
    clientId?: string, 
    learnerId?: string, 
    status?: PlanStatus,
    approvalStatus?: ApprovalStatus,
  ) {
    const where: any = {};

    // Add filters if provided
    if (clientId) {
      where.clientId = BigInt(clientId);
    }

    if (learnerId) {
      where.learnerId = BigInt(learnerId);
    }

    if (status) {
      where.status = status;
    }

    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    const treatmentPlans = await this.prismaService.treatmentPlan.findMany({
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
        _count: {
          select: {
            goals: true,
            interventions: true,
            progressNotes: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { startDate: 'desc' },
      ],
    });

    return treatmentPlans;
  }

  /**
   * Find a treatment plan by ID
   * @param id - Treatment plan ID
   * @returns The found treatment plan
   */
  async findOne(id: bigint) {
    const treatmentPlan = await this.prismaService.treatmentPlan.findUnique({
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
        goals: {
          orderBy: {
            priority: 'desc',
          },
        },
        interventions: true,
        assessments: {
          include: {
            assessment: true,
          },
        },
        progressNotes: {
          orderBy: {
            sessionDate: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!treatmentPlan) {
      throw new NotFoundException(`Treatment plan with ID ${id} not found`);
    }

    return treatmentPlan;
  }

  /**
   * Update a treatment plan
   * @param id - Treatment plan ID
   * @param updateTreatmentPlanDto - Data for updating the treatment plan
   * @param userId - ID of the user updating this plan
   * @returns The updated treatment plan
   */
  async update(
    id: bigint,
    updateTreatmentPlanDto: UpdateTreatmentPlanDto,
    userId: bigint,
  ) {
    // Check if treatment plan exists
    await this.findOne(id);

    // Prepare date fields if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let reviewDate: Date | undefined;

    if (updateTreatmentPlanDto.startDate) {
      startDate = new Date(updateTreatmentPlanDto.startDate);
    }

    if (updateTreatmentPlanDto.endDate) {
      endDate = new Date(updateTreatmentPlanDto.endDate);
    }

    if (updateTreatmentPlanDto.reviewDate) {
      reviewDate = new Date(updateTreatmentPlanDto.reviewDate);
    }

    // Prepare client/learner IDs if provided
    let clientId: bigint | undefined;
    let learnerId: bigint | undefined;

    if (updateTreatmentPlanDto.clientId) {
      clientId = BigInt(updateTreatmentPlanDto.clientId);
    }

    if (updateTreatmentPlanDto.learnerId) {
      learnerId = BigInt(updateTreatmentPlanDto.learnerId);
    }

    // Update the treatment plan
    const updatedTreatmentPlan = await this.prismaService.treatmentPlan.update({
      where: { id },
      data: {
        title: updateTreatmentPlanDto.title,
        description: updateTreatmentPlanDto.description,
        startDate,
        endDate,
        reviewDate,
        status: updateTreatmentPlanDto.status,
        approvalStatus: updateTreatmentPlanDto.approvalStatus,
        approvalNotes: updateTreatmentPlanDto.approvalNotes,
        assessmentSummary: updateTreatmentPlanDto.assessmentSummary,
        clientId,
        learnerId,
        updatedBy: userId,
      },
    });

    // Update assessment connections if provided
    if (updateTreatmentPlanDto.assessmentIds) {
      // Delete existing connections
      await this.prismaService.treatmentPlanAssessment.deleteMany({
        where: { treatmentPlanId: id },
      });

      // Create new connections
      const assessmentIds = updateTreatmentPlanDto.assessmentIds.map(id => BigInt(id));
      await Promise.all(assessmentIds.map(assessmentId => 
        this.prismaService.treatmentPlanAssessment.create({
          data: {
            treatmentPlanId: id,
            assessmentId,
          },
        })
      ));
    }

    return this.findOne(id);
  }

  /**
   * Remove a treatment plan
   * @param id - Treatment plan ID
   * @returns The removed treatment plan
   */
  async remove(id: bigint) {
    // Check if treatment plan exists
    await this.findOne(id);

    // Delete all associated records first
    await this.prismaService.$transaction([
      // Delete all goal-intervention connections for this plan's goals
      this.prismaService.interventionGoal.deleteMany({
        where: {
          OR: [
            { intervention: { treatmentPlanId: id } },
            { goal: { treatmentPlanId: id } },
          ],
        },
      }),
      
      // Delete progress note goal references
      this.prismaService.progressNoteGoalReference.deleteMany({
        where: {
          OR: [
            { progressNote: { treatmentPlanId: id } },
            { goal: { treatmentPlanId: id } },
          ],
        },
      }),
      
      // Delete assessment connections
      this.prismaService.treatmentPlanAssessment.deleteMany({
        where: { treatmentPlanId: id },
      }),
      
      // Delete progress notes
      this.prismaService.progressNote.deleteMany({
        where: { treatmentPlanId: id },
      }),
      
      // Delete interventions
      this.prismaService.intervention.deleteMany({
        where: { treatmentPlanId: id },
      }),
      
      // Delete goals
      this.prismaService.goal.deleteMany({
        where: { treatmentPlanId: id },
      }),
      
      // Finally delete the treatment plan
      this.prismaService.treatmentPlan.delete({
        where: { id },
      }),
    ]);

    return { id, deleted: true };
  }

  /**
   * Add a goal to an existing treatment plan
   * @param treatmentPlanId - Treatment plan ID
   * @param createGoalDto - Data for creating the goal
   * @param userId - ID of the user creating this goal
   * @returns The created goal
   */
  async addGoal(
    treatmentPlanId: bigint,
    createGoalDto: CreateGoalDto,
    userId: bigint,
  ) {
    // Check if treatment plan exists
    await this.findOne(treatmentPlanId);

    // Create the goal
    const goal = await this.prismaService.goal.create({
      data: {
        domain: createGoalDto.domain,
        description: createGoalDto.description,
        longTermObjective: createGoalDto.longTermObjective,
        shortTermObjectives: createGoalDto.shortTermObjectives,
        priority: createGoalDto.priority,
        masteryConditions: createGoalDto.masteryConditions,
        baselinePerformance: createGoalDto.baselinePerformance,
        baselineNotes: createGoalDto.baselineNotes,
        instructionalStrategies: createGoalDto.instructionalStrategies,
        treatmentPlanId,
        createdBy: userId,
      },
    });

    return goal;
  }

  /**
   * Update a goal
   * @param id - Goal ID
   * @param updateGoalDto - Data for updating the goal
   * @param userId - ID of the user updating this goal
   * @returns The updated goal
   */
  async updateGoal(
    id: bigint,
    updateGoalDto: UpdateGoalDto,
    userId: bigint,
  ) {
    // Check if goal exists
    const goal = await this.prismaService.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    // Update the goal
    const updatedGoal = await this.prismaService.goal.update({
      where: { id },
      data: {
        domain: updateGoalDto.domain,
        description: updateGoalDto.description,
        longTermObjective: updateGoalDto.longTermObjective,
        shortTermObjectives: updateGoalDto.shortTermObjectives,
        priority: updateGoalDto.priority,
        masteryConditions: updateGoalDto.masteryConditions,
        baselinePerformance: updateGoalDto.baselinePerformance,
        baselineNotes: updateGoalDto.baselineNotes,
        instructionalStrategies: updateGoalDto.instructionalStrategies,
        updatedBy: userId,
      },
    });

    return updatedGoal;
  }

  /**
   * Remove a goal
   * @param id - Goal ID
   * @returns The removed goal
   */
  async removeGoal(id: bigint) {
    // Check if goal exists
    const goal = await this.prismaService.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    // Delete all related intervention-goal connections
    await this.prismaService.interventionGoal.deleteMany({
      where: { goalId: id },
    });

    // Delete all related progress note goal references
    await this.prismaService.progressNoteGoalReference.deleteMany({
      where: { goalId: id },
    });

    // Delete the goal
    return this.prismaService.goal.delete({
      where: { id },
    });
  }

  /**
   * Add an intervention to an existing treatment plan
   * @param treatmentPlanId - Treatment plan ID
   * @param createInterventionDto - Data for creating the intervention
   * @param userId - ID of the user creating this intervention
   * @returns The created intervention
   */
  async addIntervention(
    treatmentPlanId: bigint,
    createInterventionDto: CreateInterventionDto,
    userId: bigint,
  ) {
    // Check if treatment plan exists
    const treatmentPlan = await this.findOne(treatmentPlanId);

    // Create the intervention
    const intervention = await this.prismaService.intervention.create({
      data: {
        interventionType: createInterventionDto.interventionType,
        title: createInterventionDto.title,
        description: createInterventionDto.description,
        sessionDuration: createInterventionDto.sessionDuration,
        sessionFrequency: createInterventionDto.sessionFrequency,
        customFrequencyDetails: createInterventionDto.customFrequencyDetails,
        totalSessions: createInterventionDto.totalSessions,
        materialsRequired: createInterventionDto.materialsRequired,
        dataCollectionMethod: createInterventionDto.dataCollectionMethod,
        treatmentPlanId,
        createdBy: userId,
      },
    });

    // Connect to goals if specified
    if (createInterventionDto.goalIds && createInterventionDto.goalIds.length > 0) {
      await Promise.all(createInterventionDto.goalIds.map(async (goalIdStr) => {
        const goalId = BigInt(goalIdStr);
        
        // Check if goal exists and belongs to the same treatment plan
        const goal = await this.prismaService.goal.findFirst({
          where: { 
            id: goalId,
            treatmentPlanId,
          },
        });
        
        if (goal) {
          await this.prismaService.interventionGoal.create({
            data: {
              interventionId: intervention.id,
              goalId,
            },
          });
        }
      }));
    }

    // Return the intervention with its goal connections
    return this.prismaService.intervention.findUnique({
      where: { id: intervention.id },
      include: {
        goals: {
          include: {
            goal: true,
          },
        },
      },
    });
  }

  /**
   * Update an intervention
   * @param id - Intervention ID
   * @param updateInterventionDto - Data for updating the intervention
   * @param userId - ID of the user updating this intervention
   * @returns The updated intervention
   */
  async updateIntervention(
    id: bigint,
    updateInterventionDto: UpdateInterventionDto,
    userId: bigint,
  ) {
    // Check if intervention exists
    const intervention = await this.prismaService.intervention.findUnique({
      where: { id },
      include: { treatmentPlan: true },
    });

    if (!intervention) {
      throw new NotFoundException(`Intervention with ID ${id} not found`);
    }

    // Update the intervention
    const updatedIntervention = await this.prismaService.intervention.update({
      where: { id },
      data: {
        interventionType: updateInterventionDto.interventionType,
        title: updateInterventionDto.title,
        description: updateInterventionDto.description,
        sessionDuration: updateInterventionDto.sessionDuration,
        sessionFrequency: updateInterventionDto.sessionFrequency,
        customFrequencyDetails: updateInterventionDto.customFrequencyDetails,
        totalSessions: updateInterventionDto.totalSessions,
        materialsRequired: updateInterventionDto.materialsRequired,
        dataCollectionMethod: updateInterventionDto.dataCollectionMethod,
        updatedBy: userId,
      },
    });

    // Update goal connections if provided
    if (updateInterventionDto.goalIds !== undefined) {
      // Delete existing connections
      await this.prismaService.interventionGoal.deleteMany({
        where: { interventionId: id },
      });

      // Create new connections if goals are provided
      if (updateInterventionDto.goalIds.length > 0) {
        await Promise.all(updateInterventionDto.goalIds.map(async (goalIdStr) => {
          const goalId = BigInt(goalIdStr);
          
          // Check if goal exists and belongs to the same treatment plan
          const goal = await this.prismaService.goal.findFirst({
            where: { 
              id: goalId,
              treatmentPlanId: intervention.treatmentPlanId,
            },
          });
          
          if (goal) {
            await this.prismaService.interventionGoal.create({
              data: {
                interventionId: id,
                goalId,
              },
            });
          }
        }));
      }
    }

    // Return the updated intervention with its goal connections
    return this.prismaService.intervention.findUnique({
      where: { id },
      include: {
        goals: {
          include: {
            goal: true,
          },
        },
      },
    });
  }

  /**
   * Remove an intervention
   * @param id - Intervention ID
   * @returns The removed intervention
   */
  async removeIntervention(id: bigint) {
    // Check if intervention exists
    const intervention = await this.prismaService.intervention.findUnique({
      where: { id },
    });

    if (!intervention) {
      throw new NotFoundException(`Intervention with ID ${id} not found`);
    }

    // Delete all related intervention-goal connections
    await this.prismaService.interventionGoal.deleteMany({
      where: { interventionId: id },
    });

    // Delete the intervention
    return this.prismaService.intervention.delete({
      where: { id },
    });
  }

  /**
   * Update the status of a treatment plan
   * @param id - Treatment plan ID
   * @param status - New status
   * @param userId - ID of the user updating the status
   * @returns The updated treatment plan
   */
  async updateStatus(
    id: bigint,
    status: PlanStatus,
    userId: bigint,
  ) {
    // Check if treatment plan exists
    await this.findOne(id);

    // Update the status
    const updatedTreatmentPlan = await this.prismaService.treatmentPlan.update({
      where: { id },
      data: {
        status,
        updatedBy: userId,
      },
    });

    return updatedTreatmentPlan;
  }

  /**
   * Update the approval status of a treatment plan
   * @param id - Treatment plan ID
   * @param approvalStatus - New approval status
   * @param approvalNotes - Optional notes about the approval decision
   * @param userId - ID of the user updating the approval status
   * @returns The updated treatment plan
   */
  async updateApprovalStatus(
    id: bigint,
    approvalStatus: ApprovalStatus,
    approvalNotes: string | undefined,
    userId: bigint,
  ) {
    // Check if treatment plan exists
    await this.findOne(id);

    // Update the approval status
    const updatedTreatmentPlan = await this.prismaService.treatmentPlan.update({
      where: { id },
      data: {
        approvalStatus,
        approvalNotes,
        updatedBy: userId,
      },
    });

    return updatedTreatmentPlan;
  }
}
