import { Injectable } from '@nestjs/common';
import { Entity } from '../enums/entity.enum';
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
        action,
        entity_type,
        entity_id,
        before,
        after,
      },
    });
  }
}
