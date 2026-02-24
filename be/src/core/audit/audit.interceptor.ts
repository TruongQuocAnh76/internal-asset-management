import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { auditContext } from './audit.context';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const actorId = request.user?.id;

    if (!actorId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      auditContext.run({ actorId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
