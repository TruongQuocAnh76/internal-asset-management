import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Entity, PrismaClient } from '@prisma/client';
import { auditContext } from '../audit/audit.context';

const MODEL_ENTITY_MAP: Record<string, Entity> = {
  Assets: 'ASSET',
  AssetsKits: 'ASSET_KIT',
  Users: 'USER',
  AssetsCategories: 'CATEGORY',
  BorrowRequests: 'BORROW_REQUEST',
  AssetsAllocation: 'ASSET_ALLOCATION',
  KitTemplateItems: 'KIT_ITEM',
};

const AUDITED_OPERATIONS = new Set([
  'create',
  'update',
  'delete',
  'upsert',
  'updateMany',
  'deleteMany',
]);

function getDelegate(client: PrismaClient, model: string) {
  return (client as any)[model[0].toLowerCase() + model.slice(1)];
}

function normalizeBigInt<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  return JSON.parse(
    JSON.stringify(value, (_, nestedValue) =>
      typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue,
    ),
  ) as T;
}

function createExtendedClient() {
  const baseClient = new PrismaClient();
  const logger = new Logger('PrismaAudit');

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            !AUDITED_OPERATIONS.has(operation) ||
            !(model in MODEL_ENTITY_MAP)
          ) {
            const result = await query(args);
            return normalizeBigInt(result);
          }

          const ctx = auditContext.getStore();
          if (!ctx?.actorId) {
            const result = await query(args);
            return normalizeBigInt(result);
          }

          const entityType = MODEL_ENTITY_MAP[model];
          const actorId = ctx.actorId;
          const delegate = getDelegate(baseClient, model);

          // get before state
          let beforeRecords: any[] = [];

          if (
            operation === 'update' ||
            operation === 'delete' ||
            operation === 'upsert'
          ) {
            const before = await delegate.findUnique({
              where: (args as any).where,
            });
            if (before) beforeRecords = [before];
          } else if (operation === 'updateMany' || operation === 'deleteMany') {
            beforeRecords = await delegate.findMany({
              where: (args as any).where,
            });
          }

          // execute main query
          const result = await query(args);
          const record = result as Record<string, any> | null;

          // Write audit log(s) — failures must not break the main operation
          try {
            switch (operation) {
              case 'create':
                await baseClient.auditLogs.create({
                  data: {
                    actor_id: actorId,
                    action: 'CREATE',
                    entity_type: entityType,
                    entity_id: record?.id,
                    before: {},
                    after: record ?? {},
                  },
                });
                break;

              case 'update':
                await baseClient.auditLogs.create({
                  data: {
                    actor_id: actorId,
                    action: 'UPDATE',
                    entity_type: entityType,
                    entity_id: record?.id,
                    before: beforeRecords[0] ?? {},
                    after: record ?? {},
                  },
                });
                break;

              case 'delete':
                await baseClient.auditLogs.create({
                  data: {
                    actor_id: actorId,
                    action: 'DELETE',
                    entity_type: entityType,
                    entity_id: beforeRecords[0]?.id ?? (args as any).where?.id,
                    before: beforeRecords[0] ?? {},
                    after: {},
                  },
                });
                break;

              case 'upsert': {
                const isCreate = beforeRecords.length === 0;
                await baseClient.auditLogs.create({
                  data: {
                    actor_id: actorId,
                    action: isCreate ? 'CREATE' : 'UPDATE',
                    entity_type: entityType,
                    entity_id: record?.id,
                    before: beforeRecords[0] ?? {},
                    after: record ?? {},
                  },
                });
                break;
              }

              case 'updateMany':
                for (const record of beforeRecords) {
                  await baseClient.auditLogs.create({
                    data: {
                      actor_id: actorId,
                      action: 'UPDATE',
                      entity_type: entityType,
                      entity_id: record.id,
                      before: record,
                      after: (args as any).data ?? {},
                    },
                  });
                }
                break;

              case 'deleteMany':
                for (const record of beforeRecords) {
                  await baseClient.auditLogs.create({
                    data: {
                      actor_id: actorId,
                      action: 'DELETE',
                      entity_type: entityType,
                      entity_id: record.id,
                      before: record,
                      after: {},
                    },
                  });
                }
                break;
            }
          } catch (error: any) {
            logger.warn(`Failed to create audit log: ${error.message}`);
          }

          return normalizeBigInt(result);
        },
      },
    },
  });
}

class ExtendedPrismaClientBase {
  constructor() {
    return createExtendedClient() as any;
  }
}

const ExtendedPrismaClient =
  ExtendedPrismaClientBase as unknown as new () => ReturnType<
    typeof createExtendedClient
  >;

@Injectable()
export class PrismaService
  extends ExtendedPrismaClient
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
