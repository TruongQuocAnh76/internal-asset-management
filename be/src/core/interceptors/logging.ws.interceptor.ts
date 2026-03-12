import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Socket } from 'socket.io';

@Injectable()
export class LoggingWsInterceptor implements NestInterceptor {
	private readonly logger = new Logger('WS');

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const wsContext = context.switchToWs();
		const client = wsContext.getClient<Socket>();
		const payload = wsContext.getData();
		const handler = context.getHandler().name;
		const gateway = context.getClass().name;
		const clientId = client?.id ?? 'unknown';

		this.logger.log(
			`Event: ${gateway}.${handler} | Client: ${clientId} | Payload: ${JSON.stringify(payload)}`,
		);

		const now = Date.now();

		return next.handle().pipe(
			tap((response) =>
				this.logger.log(
					`Handled: ${gateway}.${handler} | Client: ${clientId} - ${Date.now() - now}ms | Response: ${JSON.stringify(response)}`,
				),
			),
		);
	}
}
