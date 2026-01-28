import { Users } from '@prisma/client';

export class AuthenticatedRequest extends Request {
  user: Users;
}
