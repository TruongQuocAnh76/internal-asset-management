import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContextData {
  actorId: string;
}

export const auditContext = new AsyncLocalStorage<AuditContextData>();
