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
import {
  NOTIFICATION_QUEUE,
  NotificationJobName,
} from './cron/notifications/notification.processor';
import { BorrowMailContext } from 'src/core/mail/mail.service';
import {
  buildMailContextBase,
  resolveRecipients,
} from './cron/notifications/notification.util';
import { RequestProvideDto } from './dto/provide-request.dto';

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
      due_date: Date | null;
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
        this.logger.warn(
          `No recipients resolved for ${jobName} on request ${request.id}`,
        );
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
      this.logger.error(
        `Failed to enqueue ${jobName} notification: ${error.message}`,
      );
    }
  }

  async createRequest(body: CreateRequestDto) {
    if (body.kitId) {
      return this.createKitRequest(body);
    } else if (body.categoryId) {
      console.log('Creating category request with body:', body);
      return this.createCategoryRequest(body);
    }
    return this.createAssetRequest(body);
  }

  private async createCategoryRequest(body: CreateRequestDto) {
    try {
      const request = await this.prisma.borrowRequests.create({
        data: {
          category_id: body.categoryId,
          requester_id: body.requesterId,
          reason: body.reason,
          priority: body.priority,
          due_date: body.dueDate ? new Date(body.dueDate) : null,
        },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          category: { select: { name: true } },
        },
      });
      await this.enqueueNotifications(request, 'request-submitted');
      return request;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025' || error.code === 'P2003') {
          throw new NotFoundException('The requested category does not exist.');
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'You already have an active request for this category.',
          );
        }
      }
      throw error;
    }
  }

  private async createAssetRequest(body: CreateRequestDto) {
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
        },
      });
      await this.enqueueNotifications(request, 'request-submitted');
      return request;
    } catch (error) {
      const msg: string = error?.message ?? '';
      if (msg.includes('asset_not_ready')) {
        throw new ConflictException(
          'Cannot create a borrow request: the asset is not in READY status.',
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025' || error.code === 'P2003') {
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

  private async createKitRequest(body: CreateRequestDto) {
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
        },
      });
      await this.enqueueNotifications(request, 'request-submitted');
      return request;
    } catch (error) {
      const msg: string = error?.message ?? '';
      if (msg.includes('kit_not_ready')) {
        throw new ConflictException(
          'Cannot create a borrow request: the kit is not in READY status.',
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025' || error.code === 'P2003') {
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
        category: {
          select: {
            id: true,
            name: true,
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
        category: {
          select: {
            id: true,
            name: true,
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

  async approveRequest(userId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      let updated;
      try {
        updated = await tx.borrowRequests.update({
          where: { id: requestId, status: BorrowStatus.PENDING },
          data: {
            status: BorrowStatus.APPROVED,
            approved_at: new Date(),
            approved_by: userId,
          },
          include: {
            user: {
              select: { first_name: true, last_name: true, email: true },
            },
            asset: { select: { name: true } },
            kit: { select: { template: { select: { name: true } } } },
          },
        });
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

      await this.enqueueNotifications(updated, 'request-approved');
      return updated;
    });
  }

  async rejectRequest(requestId: string, userId: string) {
    try {
      const updated = await this.prisma.borrowRequests.update({
        where: {
          id: requestId,
          status: { in: [BorrowStatus.PENDING, BorrowStatus.APPROVED] },
        },
        data: { status: BorrowStatus.REJECTED },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          asset: { select: { name: true } },
          kit: { select: { template: { select: { name: true } } } },
        },
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

  async provideRequest(
    userId: string,
    requestId: string,
    body: RequestProvideDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      let updated;
      try {
        updated = await tx.borrowRequests.update({
          where: { id: requestId, status: BorrowStatus.APPROVED },
          data: {
            asset_id: body.assetId ?? null,
            kit_id: body.kitId ?? null,
            status: BorrowStatus.PROVIDED,
            provided_at: new Date(),
            provided_by: userId,
          },
          include: {
            user: {
              select: { first_name: true, last_name: true, email: true },
            },
            asset: { select: { name: true } },
            kit: { select: { template: { select: { name: true } } } },
          },
        });
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

      const actualAssetId = updated.asset_id;
      const actualKitId = updated.kit_id;

      // Mark asset_items as IN_USE and recompute cached status when item is actually provided
      if (actualAssetId) {
        const readyItem = await tx.assetItems.findFirst({
          where: { asset_id: actualAssetId, status: AssetStatus.READY },
        });
        if (readyItem) {
          await tx.assetItems.update({
            where: { id: readyItem.id },
            data: { status: AssetStatus.IN_USE },
          });
          await this.recomputeAssetStatus(
            actualAssetId,
            null,
            AssetStatus.IN_USE,
            tx,
          );
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
          await this.recomputeKitStatus(
            actualKitId,
            null,
            AssetStatus.IN_USE,
            tx,
          );
          const assetIds = [...new Set(kitItems.map((i) => i.asset_id))];
          await tx.assets.updateMany({
            where: { id: { in: assetIds } },
            data: { status: AssetStatus.IN_USE },
          });
        }
      }

      await this.enqueueNotifications(updated, 'request-provided');
      return updated;
    });
  }

  async returnRequest(requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      let request;
      try {
      request = await tx.borrowRequests.findFirstOrThrow({
        where: {
          id: requestId,
          status: { in: [BorrowStatus.PROVIDED, BorrowStatus.OVERDUE] },
        },
        select: {
          id: true,
          asset_id: true,
          kit_id: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(
          'Request not found or not in PROVIDED/OVERDUE status.',
        );
      }
    }

      const actualAssetId = request.asset_id;
      const actualKitId = request.kit_id;

      if (actualAssetId) {
        const inUseItem = await tx.assetItems.findFirst({
          where: { asset_id: actualAssetId, status: AssetStatus.IN_USE },
        });
        if (inUseItem) {
          await tx.assetItems.update({
            where: { id: inUseItem.id },
            data: { status: AssetStatus.READY },
          });
          await this.recomputeAssetStatus(
            actualAssetId,
            null,
            AssetStatus.READY,
            tx,
          );
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
          await this.recomputeKitStatus(
            actualKitId,
            null,
            AssetStatus.READY,
            tx,
          );
          const assetIds = [...new Set(kitItems.map((i) => i.asset_id))];
          await tx.assets.updateMany({
            where: { id: { in: assetIds } },
            data: { status: AssetStatus.READY },
          });
        }
      }

      let updated;
      try {
        updated = await tx.borrowRequests.update({
          where: {
            id: requestId,
            status: { in: [BorrowStatus.PROVIDED, BorrowStatus.OVERDUE] },
          },
          data: {
            status: BorrowStatus.RETURNED,
            returned_at: new Date(),
          },
          include: {
            user: {
              select: { first_name: true, last_name: true, email: true },
            },
            asset: { select: { name: true } },
            kit: { select: { template: { select: { name: true } } } },
          },
        });
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

      await this.enqueueNotifications(updated, 'request-returned');
      return updated;
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
        },
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
   * Recompute cached status on the Assets row.
   */
  private async recomputeAssetStatus(
    assetId: string,
    currentStatus: AssetStatus | null,
    updateStatus: AssetStatus | null,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    let currStatus = currentStatus;
    if (currStatus === null) {
      const current = await client.assets.findUnique({
        where: { id: assetId },
        select: { status: true },
      });
      if (!current) return;
      currStatus = current.status as AssetStatus;
    }
    const readyCount = await client.assetItems.count({
      where: { asset_id: assetId, status: AssetStatus.READY },
    });

    // If current is READY and we still have a READY item, stay READY
    if (currStatus === AssetStatus.READY && readyCount > 0) {
      return;
    }

    // If we found a READY item and current is not READY, switch to READY
    if (currStatus !== AssetStatus.READY && readyCount > 0) {
      await client.assets.update({
        where: { id: assetId },
        data: { status: AssetStatus.READY },
      });
      return;
    }

    // Current is not READY and no READY items found
    // Check if all items have the current non-READY status
    const total = await client.assetItems.count({
      where: { asset_id: assetId },
    });
    const sameStatusCount = await client.assetItems.count({
      where: { asset_id: assetId, status: currStatus },
    });

    const newStatus =
      sameStatusCount === total ? currStatus : AssetStatus.IN_USE;

    if (newStatus !== currStatus) {
      await client.assets.update({
        where: { id: assetId },
        data: { status: newStatus },
      });
    }
  }

  /**
   * Recompute cached status on the AssetsKits row.
   * Efficient approach: only query when needed.
   */
  private async recomputeKitStatus(
    kitId: string,
    currentStatus: AssetStatus | null,
    updateStatus: AssetStatus | null,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    let currStatus = currentStatus;
    if (currStatus === null) {
      const current = await client.assetsKits.findUnique({
        where: { id: kitId },
        select: { status: true },
      });
      if (!current) return;
      currStatus = current.status as AssetStatus;
    }
    const total = await client.assetItems.count({
      where: { kit_id: kitId },
    });
    const readyCount = await client.assetItems.count({
      where: { kit_id: kitId, status: AssetStatus.READY },
    });

    let newStatus: AssetStatus;

    // READY only if ALL items are READY
    if (readyCount === total) {
      newStatus = AssetStatus.READY;
    } else if (currStatus === AssetStatus.READY) {
      // Was READY, now has non-READY items → check what status they have
      const currStatusCount = await client.assetItems.count({
        where: { kit_id: kitId, status: currStatus },
      });
      newStatus = currStatusCount > 0 ? currStatus : AssetStatus.IN_USE;
    } else {
      // Check if all items have the current non-READY status
      const currStatusCount = await client.assetItems.count({
        where: { kit_id: kitId, status: currStatus },
      });
      newStatus = currStatusCount === total ? currStatus : AssetStatus.IN_USE;
    }

    if (newStatus !== currStatus) {
      await client.assetsKits.update({
        where: { id: kitId },
        data: { status: newStatus },
      });
    }
    const kit = await client.assetsKits.findUnique({
      where: { id: kitId },
      select: { template_id: true },
    });
    if (kit) {
      const readyKitCount = await client.assetsKits.count({
        where: { template_id: kit.template_id, status: AssetStatus.READY },
      });
      const templateStatus =
        readyKitCount > 0 ? AssetStatus.READY : AssetStatus.IN_USE;
      await client.kitTemplates.update({
        where: { id: kit.template_id },
        data: { status: templateStatus },
      });
    }
  }
}
