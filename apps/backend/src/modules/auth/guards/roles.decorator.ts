import { SetMetadata } from '@nestjs/common';
import { UserRole } from './roles.guard';

/**
 * Custom decorator to specify required roles for a route
 * Usage: @Roles(UserRole.ADMIN, UserRole.THERAPIST)
 * @param roles - Array of required user roles
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
