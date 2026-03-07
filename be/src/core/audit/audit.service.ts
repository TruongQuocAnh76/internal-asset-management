import { Injectable } from '@nestjs/common';
import { Entity, AuditAction } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async addRecord(
    actor_id: string,
    action: string,
    entity_type: Entity,
    entity_id: string,
    before: Prisma.InputJsonValue,
    after: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLogs.create({
      data: {
        actor_id,
        action: action as AuditAction,
        entity_type,
        entity_id,
        before,
        after,
      },
    });
  }

  async findAll(filters: {
    entity_type?: Entity;
    actor_id?: string;
    entity_id?: string;
    action?: AuditAction;
    page?: number;
    limit?: number;
  }) {
    const { entity_type, actor_id, entity_id, action, page = 1, limit = 25 } = filters;

    const where: Prisma.AuditLogsWhereInput = {};
    if (entity_type) where.entity_type = entity_type;
    if (actor_id) where.actor_id = actor_id;
    if (entity_id) where.entity_id = entity_id;
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
