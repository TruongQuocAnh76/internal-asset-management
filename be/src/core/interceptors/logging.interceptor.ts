import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, originalUrl, body, query, params } = request as any;

    this.logger.log(
      `Request: ${method} ${originalUrl} | Query: ${JSON.stringify(
        query,
      )} | Params: ${JSON.stringify(params)} | Body: ${JSON.stringify(body)}`,
    );

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap((responseBody) =>
          this.logger.log(
            `Response: ${method} ${originalUrl} - ${Date.now() - now}ms | Response Body: ${JSON.stringify(responseBody)}`,
          ),
        ),
      );
  }
}
