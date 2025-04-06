import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../types/prisma-models';

/**
 * Key for roles metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Role-based access control decorator
 * @param roles - Array of user roles allowed to access the endpoint
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
