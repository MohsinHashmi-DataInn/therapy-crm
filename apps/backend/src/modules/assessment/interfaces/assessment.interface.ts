/**
 * Interface representing an Assessment
 * This is used as a temporary solution since the assessment model does not exist in the Prisma schema yet
 */
export interface Assessment {
  id: bigint;
  assessmentType: string;
  assessmentDate: Date;
  evaluator?: string;
  scores?: any;
  summary?: string;
  recommendations?: string;
  notes?: string;
  clientId: bigint;
  learnerId?: bigint;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: bigint;
  updatedBy?: bigint;
}
