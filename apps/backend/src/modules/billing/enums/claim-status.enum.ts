/**
 * Possible statuses for an insurance claim
 */
export enum ClaimStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  DENIED = 'DENIED',
  APPEALED = 'APPEALED',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
}
