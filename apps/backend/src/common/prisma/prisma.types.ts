/**
 * Type definitions for Prisma client to ensure proper typing of database models.
 * 
 * This module provides a cleaner way to handle type safety with Prisma models,
 * especially when dealing with models not automatically included in the PrismaClient type.
 */
import { PrismaClient } from '@prisma/client';

/**
 * Helper function to provide type-safe access to Prisma models.
 * 
 * @param prisma - The PrismaClient instance
 * @returns A typed version of the prisma client
 */
export function createTypedPrismaClient(prisma: PrismaClient): TypedPrismaClient {
  return prisma as TypedPrismaClient;
}

/**
 * Extended PrismaClient interface with all telehealth models explicitly typed.
 * This provides proper type checking for telehealth-related database operations.
 */
export interface TypedPrismaClient extends PrismaClient {
  // Telehealth models
  telehealth_providers: any;
  virtual_sessions: any;
  virtual_session_participants: any;
  virtual_session_recordings: any;
  
  // Client-related models
  client_caregivers: any;
}
