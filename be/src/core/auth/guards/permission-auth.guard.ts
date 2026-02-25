import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const required = this.reflector.getAllAndOverride<string[]>('permission', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    if (!user || !user.permissions) {
      return false;
    }

    const allowed = required.every((permission) =>
      user.permissions.includes(permission),
    );

    return allowed;
  }
}
