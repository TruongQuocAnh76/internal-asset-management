import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Entity, AuditAction } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(SessionAuthGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Get()
  findAll(
    @Query('entity_type') entityType?: Entity,
    @Query('actor_id') actorId?: string,
    @Query('entity_id') entityId?: string,
    @Query('action') action?: AuditAction,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAll({
      entityType,
      actorId,
      entityId,
      action,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }
}
