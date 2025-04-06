/**
 * Type definitions for Prisma models to help with TypeScript compatibility
 */
import { Prisma } from '@prisma/client';

// Practice interface
export interface Practice {
  id: bigint;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website?: string;
  tax_id?: string;
  npi?: string;
  logo_url?: string;
  created_at: Date;
  updated_at?: Date;
  [key: string]: any;
}

// Define enums that can be used as both types and values
export enum UserRole {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST',
  RECEPTIONIST = 'RECEPTIONIST',
  BILLING = 'BILLING',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER', // Added MANAGER role
  STAFF = 'STAFF' // Added STAFF role that was missing
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
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CASH = 'CASH',
  INSURANCE = 'INSURANCE',
  INSURANCE_DIRECT = 'INSURANCE_DIRECT',
  FUNDING_PROGRAM = 'FUNDING_PROGRAM',
  OTHER = 'OTHER'
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

// PrismaExtensions namespace is defined below

// User related types
export interface User {
  id: bigint;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: bigint | null;
  updatedBy?: bigint | null;
}

export interface NotificationPreference {
  id: bigint;
  userId: bigint;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Practice related types
export interface Practice {
  id: bigint;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  npi?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: bigint | null;
  updatedBy?: bigint | null;
}

// Billing related types

// Invoice related types
export interface InvoiceWhereInput {
  id?: bigint;
  client_id?: bigint;
  status?: InvoiceStatus;
  created_at?: Date | { gte?: Date; lte?: Date };
  due_date?: Date | { gte?: Date; lte?: Date };
  [key: string]: any;
}

// Extend Prisma namespace with our custom types
export namespace PrismaExtensions {
  export function sql(strings: TemplateStringsArray, ...values: any[]): any {
    return { text: strings.join('?'), values };
  }
  
  export function join(values: any[]): string {
    return values.join(',');
  }
}

// User input types
export interface UsersUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
  updated_at?: Date;
  [key: string]: any;
}

// Client input types
export interface ClientsCreateInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider_id?: bigint;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  created_by?: bigint;
  [key: string]: any;
}

export interface ClientsUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider_id?: bigint;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  updated_at?: Date;
  updated_by?: bigint;
  [key: string]: any;
}

// Communication input types
export interface CommunicationsCreateInput {
  client_id: bigint;
  user_id: bigint;
  type: string;
  subject: string;
  content: string;
  status: string;
  sent_at?: Date;
  created_at?: Date;
  created_by?: bigint;
  [key: string]: any;
}

// Add the extensions to the Prisma namespace
declare global {
  namespace Prisma {
    export const sql: typeof PrismaExtensions.sql;
    export const join: typeof PrismaExtensions.join;
    export type invoicesWhereInput = InvoiceWhereInput;
    export type usersUpdateInput = UsersUpdateInput;
    export type clientsCreateInput = ClientsCreateInput;
    export type clientsUpdateInput = ClientsUpdateInput;
    export type communicationsCreateInput = CommunicationsCreateInput;
  }
}
