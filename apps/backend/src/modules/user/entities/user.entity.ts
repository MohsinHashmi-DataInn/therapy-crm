/**
 * User entity representing a user in the system
 */
export interface User {
  id: bigint;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy?: bigint | null;
  updatedBy?: bigint | null;
}
