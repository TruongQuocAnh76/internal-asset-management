import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  AssetStatus,
  BorrowPriority,
  BorrowStatus,
  Prisma,
} from '@prisma/client';
import { GetRequestsDto } from './dto/get-request.dto';
import { AuditService } from 'src/core/audit/audit.service';
import { Entity } from 'src/core/enums/entity.enum';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createRequest(body: CreateRequestDto, userId: string) {
    // check if asset exists
    const asset = await this.prisma.assets.findUnique({
      where: { id: body.assetId },
    });

    if (!asset) {
      throw new NotFoundException('The requested asset does not exist.');
    }
    // check if user already made the request for the same asset
    const alreadyRequested = await this.prisma.borrowRequests.findFirst({
      where: {
        asset_id: body.assetId,
        requester_id: body.requesterId,
        status: {
          in: [
            BorrowStatus.PENDING,
            BorrowStatus.APPROVED,
            BorrowStatus.PROVIDED,
          ],
        },
      },
    });

    if (alreadyRequested) {
      throw new ConflictException(
        'You have already made a request for this asset.',
      );
    }

    const createdRequest = await this.prisma.borrowRequests.create({
      data: {
        asset_id: body.assetId,
        requester_id: body.requesterId,
        reason: body.reason,
        priority: body.priority,
      },
    });

    // Add audit record
    await this.auditService.addRecord(
      userId,
      'CREATE',
      Entity.BORROW_REQUEST,
      createdRequest.id,
      JSON.stringify({}),
      JSON.stringify(body),
    );

    return createdRequest;
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
    if (!((body.assetId && !body.kitId) || (!body.assetId && body.kitId))) {
      throw new ConflictException(
        'You must provide either an assetId or a kitId',
      );
    }
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });

    const updatedRequest = await this.prisma.borrowRequests.updateMany({
      where: { id: requestId, requester_id: userId },
      data: {
        // update asset_id or kit_id
        ...(body.assetId ? { asset_id: body.assetId } : { kit_id: body.kitId }),
        reason: body.reason,
        priority: body.priority,
      },
    });

    // Add audit record
    await this.auditService.addRecord(
      userId,
      'UPDATE',
      Entity.BORROW_REQUEST,
      requestId,
      JSON.stringify(beforeRequest),
      JSON.stringify(body),
    );

    return updatedRequest;
  }

  async approveRequest(
    userId: string,
    requestId: string,
    assetId?: string,
    kitId?: string,
  ) {
    if (!((assetId && !kitId) || (!assetId && kitId))) {
      throw new ConflictException(
        'You must provide either an assetId or a kitId',
      );
    }
    // Get before state
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });
    let before = {} as
      | Prisma.AssetsGetPayload<{}>
      | Prisma.AssetsKitsGetPayload<{}>
      | null;
    if (kitId === undefined) {
      before = await this.prisma.assets.findUnique({
        where: { id: assetId },
      });
    } else {
      before = await this.prisma.assetsKits.findUnique({
        where: { id: kitId },
      });
    }

    // Mark an asset_item as IN_USE and recompute cached status
    if (kitId === undefined) {
      const readyItem = await this.prisma.assetItems.findFirst({
        where: { asset_id: assetId, status: AssetStatus.READY },
      });
      if (readyItem) {
        await this.prisma.assetItems.update({
          where: { id: readyItem.id },
          data: { status: AssetStatus.IN_USE },
        });
        await this.recomputeAssetStatus(assetId!);
      }
    } else {
      const kitItems = await this.prisma.assetItems.findMany({
        where: { kit_id: kitId, status: AssetStatus.READY },
      });
      if (kitItems.length > 0) {
        await this.prisma.assetItems.updateMany({
          where: { kit_id: kitId, status: AssetStatus.READY },
          data: { status: AssetStatus.IN_USE },
        });
        await this.recomputeKitStatus(kitId);
        // Also recompute parent asset statuses
        const assetIds = [...new Set(kitItems.map((i) => i.asset_id))];
        for (const id of assetIds) {
          await this.recomputeAssetStatus(id);
        }
      }
    }

    const after = kitId === undefined
      ? await this.prisma.assets.findUnique({ where: { id: assetId } })
      : await this.prisma.assetsKits.findUnique({ where: { id: kitId } });

    const updatedRequest = await this.prisma.borrowRequests.update({
      where: { id: requestId, status: BorrowStatus.PENDING },
      data: {
        status: BorrowStatus.APPROVED,
        approved_at: new Date(),
        approved_by: userId,
      },
    });

    // Add audit records
    await this.auditService.addRecord(
      userId,
      'APPROVE',
      Entity.BORROW_REQUEST,
      requestId,
      JSON.stringify(beforeRequest),
      JSON.stringify(updatedRequest),
    );

    await this.auditService.addRecord(
      userId,
      'UPDATE_STATUS',
      (assetId !== undefined ? Entity.ASSET : Entity.ASSET_KIT) as Entity,
      (assetId !== undefined ? assetId : kitId) as string,
      JSON.stringify(before),
      JSON.stringify(after),
    );

    return updatedRequest;
  }

  async rejectRequest(requestId: string, userId: string) {
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });

    const updatedRequest = await this.prisma.borrowRequests.update({
      where: { id: requestId, status: BorrowStatus.PENDING },
      data: {
        status: BorrowStatus.REJECTED,
      },
    });

    // Add audit record
    await this.auditService.addRecord(
      userId,
      'REJECT',
      Entity.BORROW_REQUEST,
      requestId,
      JSON.stringify(beforeRequest),
      JSON.stringify(updatedRequest),
    );

    return updatedRequest;
  }

  async provideRequest(userId: string, requestId: string) {
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });

    const updatedRequest = await this.prisma.borrowRequests.update({
      where: { id: requestId, status: BorrowStatus.APPROVED },
      data: {
        status: BorrowStatus.PROVIDED,
        provided_at: new Date(),
        provided_by: userId,
      },
    });

    // Add audit record
    await this.auditService.addRecord(
      userId,
      'PROVIDE',
      Entity.BORROW_REQUEST,
      requestId,
      JSON.stringify(beforeRequest),
      JSON.stringify(updatedRequest),
    );

    return updatedRequest;
  }

  async returnRequest(
    requestId: string,
    userId: string,
    assetId?: string,
    kitId?: string,
  ) {
    if (!((assetId && !kitId) || (!assetId && kitId))) {
      throw new ConflictException(
        'You must provide either an assetId or a kitId',
      );
    }

    // Get before state
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });
    let before = {} as
      | Prisma.AssetsGetPayload<{}>
      | Prisma.AssetsKitsGetPayload<{}>
      | null;
    if (kitId === undefined) {
      before = await this.prisma.assets.findUnique({
        where: { id: assetId },
      });
    } else {
      before = await this.prisma.assetsKits.findUnique({
        where: { id: kitId },
      });
    }

    // Mark asset_items as READY and recompute cached status
    if (kitId === undefined) {
      const inUseItem = await this.prisma.assetItems.findFirst({
        where: { asset_id: assetId, status: AssetStatus.IN_USE },
      });
      if (inUseItem) {
        await this.prisma.assetItems.update({
          where: { id: inUseItem.id },
          data: { status: AssetStatus.READY },
        });
        await this.recomputeAssetStatus(assetId!);
      }
    } else {
      const kitItems = await this.prisma.assetItems.findMany({
        where: { kit_id: kitId, status: AssetStatus.IN_USE },
      });
      if (kitItems.length > 0) {
        await this.prisma.assetItems.updateMany({
          where: { kit_id: kitId, status: AssetStatus.IN_USE },
          data: { status: AssetStatus.READY },
        });
        await this.recomputeKitStatus(kitId);
        // Also recompute parent asset statuses
        const assetIds = [...new Set(kitItems.map((i) => i.asset_id))];
        for (const id of assetIds) {
          await this.recomputeAssetStatus(id);
        }
      }
    }

    const after = kitId === undefined
      ? await this.prisma.assets.findUnique({ where: { id: assetId } })
      : await this.prisma.assetsKits.findUnique({ where: { id: kitId } });

    const updatedRequest = await this.prisma.borrowRequests.update({
      where: {
        id: requestId,
        status: { in: [BorrowStatus.PROVIDED, BorrowStatus.OVERDUE] },
      },
      data: {
        status: BorrowStatus.RETURNED,
        returned_at: new Date(),
      },
    });

    // Add audit records
    await this.auditService.addRecord(
      userId,
      'RETURN',
      Entity.BORROW_REQUEST,
      requestId,
      JSON.stringify(beforeRequest),
      JSON.stringify(updatedRequest),
    );

    await this.auditService.addRecord(
      userId,
      'UPDATE_STATUS',
      (assetId !== undefined ? Entity.ASSET : Entity.ASSET_KIT) as Entity,
      (assetId !== undefined ? assetId : kitId) as string,
      JSON.stringify(before),
      JSON.stringify(after),
    );

    return updatedRequest;
  }

  async cancelRequest(requestId: string, userId: string) {
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });

    const updatedRequest = await this.prisma.borrowRequests.update({
      where: {
        id: requestId,
        status: { in: [BorrowStatus.PENDING, BorrowStatus.APPROVED] },
      },
      data: {
        status: BorrowStatus.CANCELED,
      },
    });

    // Add audit record
    await this.auditService.addRecord(
      userId,
      'CANCEL',
      Entity.BORROW_REQUEST,
      requestId,
      JSON.stringify(beforeRequest),
      JSON.stringify(updatedRequest),
    );

    return updatedRequest;
  }

  async createKitRequest(body: CreateRequestDto, userId: string) {
    // check if kit exists
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: body.kitId },
    });

    if (!kit) {
      throw new NotFoundException('The requested kit does not exist.');
    }
    // check if user already made the request for the same kits
    const alreadyRequested = await this.prisma.borrowRequests.findFirst({
      where: {
        kit_id: body.kitId,
        requester_id: body.requesterId,
        status: {
          in: [
            BorrowStatus.PENDING,
            BorrowStatus.APPROVED,
            BorrowStatus.PROVIDED,
          ],
        },
      },
    });

    if (alreadyRequested)
      throw new ConflictException(
        'You have already made a request for this kits.',
      );

    const createdRequest = await this.prisma.borrowRequests.create({
      data: {
        kit_id: body.kitId,
        requester_id: body.requesterId,
        reason: body.reason,
        priority: body.priority,
      },
    });

    // Add audit record
    await this.auditService.addRecord(
      userId,
      'CREATE',
      Entity.BORROW_REQUEST,
      createdRequest.id,
      JSON.stringify({}),
      JSON.stringify(body),
    );

    return createdRequest;
  }

  /**
   * Recompute cached status on the Assets row.
   * READY if at least 1 asset_item is READY, otherwise IN_USE.
   */
  private async recomputeAssetStatus(assetId: string): Promise<void> {
    const readyCount = await this.prisma.assetItems.count({
      where: { asset_id: assetId, status: AssetStatus.READY },
    });
    const newStatus = readyCount > 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await this.prisma.assets.update({
      where: { id: assetId },
      data: { status: newStatus },
    });
  }

  /**
   * Recompute cached status on the AssetsKits row.
   * READY if ALL related asset_items are READY, otherwise IN_USE.
   * Also recomputes the parent KitTemplate status.
   */
  private async recomputeKitStatus(kitId: string): Promise<void> {
    const nonReadyCount = await this.prisma.assetItems.count({
      where: { kit_id: kitId, status: { not: AssetStatus.READY } },
    });
    const newStatus = nonReadyCount === 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await this.prisma.assetsKits.update({
      where: { id: kitId },
      data: { status: newStatus },
    });
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
      select: { template_id: true },
    });
    if (kit) {
      const readyKitCount = await this.prisma.assetsKits.count({
        where: { template_id: kit.template_id, status: AssetStatus.READY },
      });
      const templateStatus = readyKitCount > 0 ? AssetStatus.READY : AssetStatus.IN_USE;
      await this.prisma.kitTemplates.update({
        where: { id: kit.template_id },
        data: { status: templateStatus },
      });
    }
  }
}
