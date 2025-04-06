/**
 * Type definitions for Prisma models to help with TypeScript compatibility
 */
import { Prisma } from '@prisma/client';

// Define enums that can be used as both types and values
export enum UserRole {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST',
  RECEPTIONIST = 'RECEPTIONIST',
  BILLING = 'BILLING',
  SUPERVISOR = 'SUPERVISOR'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  PAID = 'PAID',
  APPEALED = 'APPEALED'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  PARTIALLY_PAID = 'PARTIALLY_PAID'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CASH = 'CASH',
  INSURANCE = 'INSURANCE'
}

export enum FundingSource {
  PRIVATE_PAY = 'PRIVATE_PAY',
  INSURANCE = 'INSURANCE',
  GRANT = 'GRANT',
  SCHOLARSHIP = 'SCHOLARSHIP'
}

export enum LearnerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  GRADUATED = 'GRADUATED',
  ON_HOLD = 'ON_HOLD'
}

// Re-export types with proper naming
declare global {
  namespace PrismaModels {
    // User related types
    type User = any;
    type NotificationPreference = any;
    
    // Billing related types
    type Practice = any;
  }
}

// Add SQL helper to Prisma namespace
declare namespace Prisma {
  function sql(strings: TemplateStringsArray, ...values: any[]): any;
}

export {};
