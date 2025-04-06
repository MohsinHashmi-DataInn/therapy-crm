import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProgressNoteDto } from './dto/create-progress-note.dto';

/**
 * Service handling progress notes and treatment plan goal tracking
 */
@Injectable()
export class ProgressNotesService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new progress note with goal progress updates
   * @param createProgressNoteDto - Data for creating the progress note
   * @param userId - ID of the user creating this note
   * @returns The created progress note with its goal updates
   */
  async create(createProgressNoteDto: CreateProgressNoteDto, userId: bigint) {
    // Verify treatment plan exists
    const treatmentPlan = await this.prismaService.treatment_plans.findUnique({
      where: { id: BigInt(createProgressNoteDto.treatmentPlanId) },
      include: { treatment_goals: true },
    });

    if (!treatmentPlan) {
      throw new NotFoundException(`Treatment plan with ID ${createProgressNoteDto.treatmentPlanId} not found`);
    }

    // Verify learner exists
    const learner = await this.prismaService.learners.findUnique({
      where: { 
        id: BigInt(createProgressNoteDto.learnerId),
      },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${createProgressNoteDto.learnerId} not found`);
    }

    // Verify all goals exist in the treatment plan
    const treatmentGoalIds = treatmentPlan.treatment_goals.map(goal => Number(goal.id));
    const invalidGoalIds = createProgressNoteDto.goalProgress
      .map(gp => gp.goalId)
      .filter(goalId => !treatmentGoalIds.includes(goalId));

    if (invalidGoalIds.length > 0) {
      throw new BadRequestException(`The following goal IDs are not part of the treatment plan: ${invalidGoalIds.join(', ')}`);
    }

    // Create the progress note
    const progressNote = await this.prismaService.progress_notes.create({
      data: {
        treatment_plan_id: BigInt(createProgressNoteDto.treatmentPlanId),
        learner_id: BigInt(createProgressNoteDto.learnerId),
        session_date: new Date(createProgressNoteDto.sessionDate),
        note_content: createProgressNoteDto.noteContent,
        assessment_type: createProgressNoteDto.assessmentType,
        assessment_score: createProgressNoteDto.assessmentScore ? parseFloat(createProgressNoteDto.assessmentScore.toString()) : null,
        progress_indicators: createProgressNoteDto.progressIndicators,
        behaviors_observed: createProgressNoteDto.behaviorsObserved,
        intervention_effectiveness: createProgressNoteDto.interventionEffectiveness,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: userId,
        updated_by: userId,
      },
    });

    // Create goal progress entries
    const goalProgressEntries = await Promise.all(
      createProgressNoteDto.goalProgress.map(async (goalProgress) => {
        return this.prismaService.treatment_goals_progress.create({
          data: {
            goal_id: BigInt(goalProgress.goalId),
            progress_note_id: progressNote.id,
            progress_percentage: goalProgress.progressPercentage,
            status: goalProgress.status,
            data_points: goalProgress.dataPoints || {},
            notes: goalProgress.notes,
            date_recorded: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
            created_by: userId,
            updated_by: userId,
          },
        });
      })
    );

    return {
      ...progressNote,
      goalProgress: goalProgressEntries,
    };
  }

  /**
   * Get all progress notes for a treatment plan
   * @param treatmentPlanId - ID of the treatment plan
   * @returns List of progress notes with goal progress
   */
  async findAllByTreatmentPlan(treatmentPlanId: number) {
    const treatmentPlan = await this.prismaService.treatment_plans.findUnique({
      where: { id: BigInt(treatmentPlanId) },
    });

    if (!treatmentPlan) {
      throw new NotFoundException(`Treatment plan with ID ${treatmentPlanId} not found`);
    }

    const progressNotes = await this.prismaService.progress_notes.findMany({
      where: { treatment_plan_id: BigInt(treatmentPlanId) },
      orderBy: { session_date: 'desc' },
    });

    // For each note, get the goal progress entries
    const progressNotesWithGoals = await Promise.all(
      progressNotes.map(async (note) => {
        const goalProgress = await this.prismaService.treatment_goals_progress.findMany({
          where: { progress_note_id: note.id },
          include: {
            treatment_goals: true,
          },
        });

        return {
          ...note,
          goalProgress,
        };
      })
    );

    return progressNotesWithGoals;
  }

  /**
   * Get a specific progress note by ID
   * @param id - ID of the progress note
   * @returns The progress note with its goal updates
   */
  async findOne(id: number) {
    const progressNote = await this.prismaService.progress_notes.findUnique({
      where: { id: BigInt(id) },
    });

    if (!progressNote) {
      throw new NotFoundException(`Progress note with ID ${id} not found`);
    }

    const goalProgress = await this.prismaService.treatment_goals_progress.findMany({
      where: { progress_note_id: progressNote.id },
      include: {
        treatment_goals: true,
      },
    });

    return {
      ...progressNote,
      goalProgress,
    };
  }

  /**
   * Generate a progress report for a learner over a specific period
   * @param learnerId - ID of the learner
   * @param startDate - Start date for the report
   * @param endDate - End date for the report
   * @returns Progress report with aggregated data
   */
  async generateProgressReport(learnerId: number, startDate: string, endDate: string) {
    const learner = await this.prismaService.learners.findUnique({
      where: { id: BigInt(learnerId) },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${learnerId} not found`);
    }

    // Get all progress notes for this learner in the date range
    const progressNotes = await this.prismaService.progress_notes.findMany({
      where: {
        learner_id: BigInt(learnerId),
        session_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { session_date: 'asc' },
    });

    // Get all treatment plans associated with these progress notes
    const treatmentPlanIds = [...new Set(progressNotes.map(note => Number(note.treatment_plan_id)))];
    const treatmentPlans = await this.prismaService.treatment_plans.findMany({
      where: {
        id: {
          in: treatmentPlanIds.map(id => BigInt(id.toString())),
        },
      },
      include: {
        treatment_goals: true,
      },
    });

    // Get all goal progress entries for these notes
    const progressNoteIds = progressNotes.map(note => note.id);
    const allGoalProgress = await this.prismaService.treatment_goals_progress.findMany({
      where: {
        progress_note_id: {
          in: progressNoteIds,
        },
      },
      include: {
        treatment_goals: true,
      },
      orderBy: { date_recorded: 'asc' },
    });

    // Analyze progress over time for each goal
    const goalProgressTracking = {};
    allGoalProgress.forEach(progress => {
      const goalId = Number(progress.goal_id);
      if (!goalProgressTracking[goalId]) {
        goalProgressTracking[goalId] = {
          goalDetails: progress.treatment_goals,
          progressHistory: [],
        };
      }
      
      goalProgressTracking[goalId].progressHistory.push({
        date: progress.date_recorded,
        percentage: progress.progress_percentage,
        status: progress.status,
        dataPoints: progress.data_points,
        notes: progress.notes,
      });
    });

    // Calculate trend data and improvement rates
    Object.keys(goalProgressTracking).forEach(goalId => {
      const history = goalProgressTracking[goalId].progressHistory;
      
      if (history.length >= 2) {
        const firstEntry = history[0];
        const lastEntry = history[history.length - 1];
        
        goalProgressTracking[goalId].improvement = lastEntry.percentage - firstEntry.percentage;
        goalProgressTracking[goalId].daysElapsed = 
          Math.round((lastEntry.date.getTime() - firstEntry.date.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate rate of improvement per week if enough data
        if (goalProgressTracking[goalId].daysElapsed > 0) {
          goalProgressTracking[goalId].weeklyImprovementRate = 
            (goalProgressTracking[goalId].improvement / goalProgressTracking[goalId].daysElapsed) * 7;
        }
      }
    });

    return {
      learner,
      reportPeriod: {
        startDate,
        endDate,
      },
      sessionCount: progressNotes.length,
      treatmentPlans,
      goalProgressTracking,
      progressNotes,
    };
  }
}
