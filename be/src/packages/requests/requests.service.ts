import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateRequestDto } from './dto/create-request.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  AssetStatus,
  BorrowPriority,
  BorrowStatus,
  Prisma,
} from '@prisma/client';
import { GetRequestsDto } from './dto/get-request.dto';
import { NOTIFICATION_QUEUE, NotificationJobName } from './notifications/notification.processor';
import { BorrowMailContext } from 'src/mail/mail.service';
import { buildMailContextBase, resolveRecipients } from './notifications/notification.util';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUE) private notificationQueue: Queue,
  ) {}

  /**
   * Resolve recipients via the notification util and enqueue one job per recipient.
   */
  private async enqueueNotifications(
    request: {
      id: string;
      reason: string | null;
      due_date: Date;
      provided_by?: string | null;
      user: { first_name: string; last_name: string; email: string };
      asset?: { name: string } | null;
      kit?: { template: { name: string } } | null;
    },
    jobName: NotificationJobName,
  ) {
    try {
      const recipients = await resolveRecipients(jobName, request, this.prisma);

      if (recipients.length === 0) {
        this.logger.warn(`No recipients resolved for ${jobName} on request ${request.id}`);
        return;
      }

      const base = buildMailContextBase(request);

      for (const recipient of recipients) {
        const ctx: BorrowMailContext = { ...base, ...recipient };
        await this.notificationQueue.add(jobName, ctx);
      }

      this.logger.log(
        `Enqueued ${jobName} to ${recipients.length} recipient(s) for request ${request.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to enqueue ${jobName} notification: ${error.message}`);
    }
  }

  async createRequest(body: CreateRequestDto, userId: string) {
    if (body.kitId) {
      return this.createKitRequest(body, userId);
    }
    return this.createAssetRequest(body, userId);
  }

  private async createAssetRequest(body: CreateRequestDto, userId: string) {
    try {
      const request = await this.prisma.borrowRequests.create({
        data: {
          asset_id: body.assetId,
          requester_id: body.requesterId,
          reason: body.reason,
          priority: body.priority,
          due_date: new Date(body.dueDate),
        },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          asset: { select: { name: true } },
        }
      });
      await this.enqueueNotifications(request, 'request-submitted');
      return request;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('The requested asset does not exist.');
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'You already have an active request for this asset.',
          );
        }
      }
      throw error;
    }
  }

  private async createKitRequest(body: CreateRequestDto, userId: string) {
    try {
      const request = await this.prisma.borrowRequests.create({
        data: {
          kit_id: body.kitId,
          requester_id: body.requesterId,
          reason: body.reason,
          priority: body.priority,
          due_date: new Date(body.dueDate),
        },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          kit: { select: { template: { select: { name: true } } } },
        }
      });
      await this.enqueueNotifications(request, 'request-submitted');
      return request;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('The requested kit does not exist.');
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'You already have an active request for this kit.',
          );
        }
      }
      throw error;
    }
  }

  async getRequests(query: GetRequestsDto) {
    const where = this.buildWhere(query);
    const take = Number(query.limit) || 20;
    const skip = query.page ? (query.page - 1) * take : 0;

    // Use sort field for ordering, not filter
    const orderBy = query.orderBy
      ? { [query.orderBy]: 'asc' as const }
      : undefined;
    return this.prisma.borrowRequests.findMany({
      where: where,
      orderBy: orderBy,
      skip: skip,
      take: take,
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
        kit: {
          select: {
            id: true,
            status: true,
            template: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            username: true,
            department: true,
          },
        },
      },
    });
  }

  protected buildWhere(query: GetRequestsDto) {
    const where: Prisma.BorrowRequestsWhereInput = {};
    if (query.filter === 'status' && query.filterValue) {
      where.status = query.filterValue as BorrowStatus;
    } else if (query.filter && query.filterValue) {
      if (query.filter === 'requesterId') {
        where.requester_id = query.filterValue;
      } else if (query.filter === 'assetId') {
        where.asset_id = query.filterValue;
      } else if (query.filter === 'kitId') {
        where.kit_id = query.filterValue;
      } else if (query.filter === 'borrowPriority') {
        where.priority = query.filterValue as BorrowPriority;
      }
    }
    return where;
  }

  async getRequestById(requestId: string) {
    return this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
        kit: {
          select: {
            id: true,
            status: true,
            template: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            username: true,
            department: true,
          },
        },
      },
    });
  }

  async editRequest(userId: string, requestId: string, body: CreateRequestDto) {
    return this.prisma.borrowRequests.updateMany({
      where: { id: requestId, requester_id: userId },
      data: {
        ...(body.assetId ? { asset_id: body.assetId } : { kit_id: body.kitId }),
        reason: body.reason,
        priority: body.priority,
        due_date: new Date(body.dueDate),
      },
    });
  }

  async approveRequest(
    userId: string,
    requestId: string,
    assetId?: string,
    kitId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Fetch request — needed to determine asset vs kit
      const request = await tx.borrowRequests.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException('Request not found.');
      }

      const actualAssetId = request.asset_id;
      const actualKitId = request.kit_id;

      // Mark asset_items as IN_USE and recompute cached status
      if (actualAssetId) {
        const readyItem = await tx.assetItems.findFirst({
          where: { asset_id: actualAssetId, status: AssetStatus.READY },
        });
        if (readyItem) {
          await tx.assetItems.update({
            where: { id: readyItem.id },
            data: { status: AssetStatus.IN_USE },
          });
          await this.recomputeAssetStatusTx(tx, actualAssetId);
        }
      } else if (actualKitId) {
        const kitItems = await tx.assetItems.findMany({
          where: { kit_id: actualKitId, status: AssetStatus.READY },
        });
        if (kitItems.length > 0) {
          await tx.assetItems.updateMany({
            where: { kit_id: actualKitId, status: AssetStatus.READY },
            data: { status: AssetStatus.IN_USE },
          });
          await this.recomputeKitStatusTx(tx, actualKitId);
          const assetIds = [...new Set(kitItems.map((i) => i.asset_id))];
          for (const id of assetIds) {
            await this.recomputeAssetStatusTx(tx, id);
          }
        }
      }

      try {
        const updated = await tx.borrowRequests.update({
          where: { id: requestId, status: BorrowStatus.PENDING },
          data: {
            status: BorrowStatus.APPROVED,
            approved_at: new Date(),
            approved_by: userId,
          },
          include: {
            user: { select: { first_name: true, last_name: true, email: true } },
            asset: { select: { name: true } },
            kit: { select: { template: { select: { name: true } } } },
          }
        });
        await this.enqueueNotifications(updated, 'request-approved');
        return updated;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException(
            'Request not found or not in PENDING status.',
          );
        }
        throw error;
      }
    });
  }

  async rejectRequest(requestId: string, userId: string) {
    try {
      const updated = await this.prisma.borrowRequests.update({
        where: { id: requestId, status: BorrowStatus.PENDING },
        data: { status: BorrowStatus.REJECTED },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          asset: { select: { name: true } },
          kit: { select: { template: { select: { name: true } } } },
        }
      });
      await this.enqueueNotifications(updated, 'request-rejected');
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'Request not found or not in PENDING status.',
        );
      }
      throw error;
    }
  }

  async provideRequest(userId: string, requestId: string) {
    try {
      const updated = await this.prisma.borrowRequests.update({
        where: { id: requestId, status: BorrowStatus.APPROVED },
        data: {
          status: BorrowStatus.PROVIDED,
          provided_at: new Date(),
          provided_by: userId,
        },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          asset: { select: { name: true } },
          kit: { select: { template: { select: { name: true } } } },
        }
      });
      await this.enqueueNotifications(updated, 'request-provided');
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'Request not found or not in APPROVED status.',
        );
      }
      throw error;
    }
  }

  async returnRequest(
    requestId: string,
    userId: string,
    assetId?: string,
    kitId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Fetch request — needed to determine asset vs kit
      const request = await tx.borrowRequests.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException('Request not found.');
      }

      const actualAssetId = request.asset_id;
      const actualKitId = request.kit_id;

      // Mark asset_items as READY and recompute cached status
      if (actualAssetId) {
        const inUseItem = await tx.assetItems.findFirst({
          where: { asset_id: actualAssetId, status: AssetStatus.IN_USE },
        });
        if (inUseItem) {
          await tx.assetItems.update({
            where: { id: inUseItem.id },
            data: { status: AssetStatus.READY },
          });
          await this.recomputeAssetStatusTx(tx, actualAssetId);
        }
      } else if (actualKitId) {
        const kitItems = await tx.assetItems.findMany({
          where: { kit_id: actualKitId, status: AssetStatus.IN_USE },
        });
        if (kitItems.length > 0) {
          await tx.assetItems.updateMany({
            where: { kit_id: actualKitId, status: AssetStatus.IN_USE },
            data: { status: AssetStatus.READY },
          });
          await this.recomputeKitStatusTx(tx, actualKitId);
          const assetIds = [...new Set(kitItems.map((i) => i.asset_id))];
          for (const id of assetIds) {
            await this.recomputeAssetStatusTx(tx, id);
          }
        }
      }

      try {
        const updated = await tx.borrowRequests.update({
          where: {
            id: requestId,
            status: { in: [BorrowStatus.PROVIDED, BorrowStatus.OVERDUE] },
          },
          data: {
            status: BorrowStatus.RETURNED,
            returned_at: new Date(),
          },
          include: {
            user: { select: { first_name: true, last_name: true, email: true } },
            asset: { select: { name: true } },
            kit: { select: { template: { select: { name: true } } } },
          } 
        });
        await this.enqueueNotifications(updated, 'request-returned');
        return updated;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException(
            'Request not found or not in PROVIDED/OVERDUE status.',
          );
        }
        throw error;
      }
    });
  }

  async cancelRequest(requestId: string, userId: string) {
    try {
      const updated = await this.prisma.borrowRequests.update({
        where: {
          id: requestId,
          status: { in: [BorrowStatus.PENDING, BorrowStatus.APPROVED] },
        },
        data: { status: BorrowStatus.CANCELED },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          asset: { select: { name: true } },
          kit: { select: { template: { select: { name: true } } } },
        }
      });
      await this.enqueueNotifications(updated, 'request-canceled');
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'Request not found or not in PENDING/APPROVED status.',
        );
      }
      throw error;
    }
  }

  /**
   * Recompute cached status on the Assets row (transaction-aware).
   */
  private async recomputeAssetStatusTx(
    tx: any,
    assetId: string,
  ): Promise<void> {
    const readyCount = await tx.assetItems.count({
      where: { asset_id: assetId, status: AssetStatus.READY },
    });
    const newStatus = readyCount > 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await tx.assets.update({
      where: { id: assetId },
      data: { status: newStatus },
    });
  }

  /**
   * Recompute cached status on the AssetsKits row (transaction-aware).
   */
  private async recomputeKitStatusTx(
    tx: any,
    kitId: string,
  ): Promise<void> {
    const nonReadyCount = await tx.assetItems.count({
      where: { kit_id: kitId, status: { not: AssetStatus.READY } },
    });
    const newStatus =
      nonReadyCount === 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await tx.assetsKits.update({
      where: { id: kitId },
      data: { status: newStatus },
    });
    const kit = await tx.assetsKits.findUnique({
      where: { id: kitId },
      select: { template_id: true },
    });
    if (kit) {
      const readyKitCount = await tx.assetsKits.count({
        where: { template_id: kit.template_id, status: AssetStatus.READY },
      });
      const templateStatus =
        readyKitCount > 0 ? AssetStatus.READY : AssetStatus.IN_USE;
      await tx.kitTemplates.update({
        where: { id: kit.template_id },
        data: { status: templateStatus },
      });
    }
  }
}
