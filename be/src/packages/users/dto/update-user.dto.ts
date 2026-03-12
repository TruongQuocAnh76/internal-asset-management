import { DeploymentStatus } from '@prisma/client';

export class UpdateUserDto {
  department?: string;
  status?: DeploymentStatus;
  role?: 'Admin' | 'Team Lead' | 'Employee';
}
