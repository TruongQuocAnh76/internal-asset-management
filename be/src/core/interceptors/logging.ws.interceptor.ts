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
import { inspect } from 'util';

@Injectable()
export class LoggingWsInterceptor implements NestInterceptor {
	private readonly logger = new Logger('WS');

	private readonly colorPrefix = '\u001b[36m';
	private readonly colorReset = '\u001b[0m';

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		  if (context.getType() !== 'ws') {
   		 	return next.handle();
  		}
		const wsContext = context.switchToWs();
		const client = wsContext.getClient<Socket>();
		const payload = wsContext.getData();
		const handler = context.getHandler().name;
		const gateway = context.getClass().name;
		const clientId = client?.id ?? 'unknown';

		this.logger.log(
			`${this.colorPrefix}Event: ${gateway}.${handler} | Client: ${clientId} | Payload: ${inspect(payload, { depth: 3 })}${this.colorReset}`,
		);

		const now = Date.now();

		return next.handle().pipe(
			tap((response) =>
				this.logger.log(
					`${this.colorPrefix}Handled: ${gateway}.${handler} | Client: ${clientId} - ${
						Date.now() - now
					}ms | Response: ${inspect(response, { depth: 3})}${this.colorReset}`,
				),
			),
		);
	}
}
