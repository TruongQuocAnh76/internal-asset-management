import { Injectable } from '@nestjs/common';
import { Entity, AuditAction } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async addRecord(
    actorId: string,
    action: string,
    entityType: Entity,
    entityId: string,
    before: Prisma.InputJsonValue,
    after: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLogs.create({
      data: {
        actor_id: actorId,
        action: action as AuditAction,
        entity_type: entityType,
        entity_id: entityId,
        before,
        after,
      },
    });
  }

  async findAll(filters: {
    entityType?: Entity;
    actorId?: string;
    entityId?: string;
    action?: AuditAction;
    page?: number;
    limit?: number;
  }) {
    const { entityType, actorId, entityId, action, page = 1, limit = 25 } = filters;

    const where: Prisma.AuditLogsWhereInput = {};
    if (entityType) where.entity_type = entityType;
    if (actorId) where.actor_id = actorId;
    if (entityId) where.entity_id = entityId;
    if (action) where.action = action;

    const [data, total] = await Promise.all([
      this.prisma.auditLogs.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLogs.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
