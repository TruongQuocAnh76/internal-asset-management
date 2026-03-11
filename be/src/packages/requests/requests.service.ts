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
  ItemStatus,
  TemplateStatus,
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
import { AssetsService } from '../assets/assets.service';
import { AssignRequestDto } from './dto/assign.dto';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private prisma: PrismaService,
    private assetsService: AssetsService,
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

      // Mark asset_items as IN_USE and propagate cached status
      if (actualAssetId) {
        const readyItem = await tx.assetItems.findFirst({
          where: { asset_id: actualAssetId, status: ItemStatus.READY },
          select: { id: true },
        });
        if (readyItem) {
          await this.assetsService.updateAssetItemStatus(
            readyItem.id,
            ItemStatus.IN_USE,
            tx,
          );
        }
      } else if (actualKitId) {
        const kitItems = await tx.assetItems.findMany({
          where: { kit_id: actualKitId, status: ItemStatus.READY },
          select: { id: true },
        });
        for (const item of kitItems) {
          await this.assetsService.updateAssetItemStatus(
            item.id,
            ItemStatus.IN_USE,
            tx,
          );
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
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException(
            'Request not found or not in PROVIDED/OVERDUE status.',
          );
        }
      }

      const actualAssetId = request.asset_id;
      const actualKitId = request.kit_id;

      if (actualAssetId) {
        const inUseItem = await tx.assetItems.findFirst({
          where: { asset_id: actualAssetId, status: ItemStatus.IN_USE },
          select: { id: true },
        });
        if (inUseItem) {
          await this.assetsService.updateAssetItemStatus(
            inUseItem.id,
            ItemStatus.READY,
            tx,
          );
        }
      } else if (actualKitId) {
        const kitItems = await tx.assetItems.findMany({
          where: { kit_id: actualKitId, status: ItemStatus.IN_USE },
          select: { id: true },
        });
        for (const item of kitItems) {
          await this.assetsService.updateAssetItemStatus(
            item.id,
            ItemStatus.READY,
            tx,
          );
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

  async assign(body: AssignRequestDto, userId: string) {
    const create = this.createRequest({
      assetId: body.assetId,
      kitId: body.kitId,
      requesterId: body.requesterId,
      reason: body.reason,
      priority: body.priority,
      dueDate: body.dueDate,
    } as CreateRequestDto);
    const approve = create.then((request) =>
      this.approveRequest(userId, request.id),
    );
    const provide = approve.then((request) =>
      this.provideRequest(userId, request.id, {
        assetId: body.assetId,
        kitId: body.kitId,
      } as RequestProvideDto),
    );
    return provide;
  }
}
