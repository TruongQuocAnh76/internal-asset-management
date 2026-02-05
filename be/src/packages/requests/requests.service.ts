import { Injectable } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  AssetStatus,
  BorrowPriority,
  BorrowStatus,
  Prisma,
} from '@prisma/client';
import { getRequestsDto } from './dto/get-request.dto';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async createRequest(body: CreateRequestDto) {
    return this.prisma.borrowRequests.create({
      data: {
        asset_id: body.assetId,
        requester_id: body.requesterId,
        reason: body.reason,
        priority: body.priority,
      },
    });
  }

  async getRequests(query: getRequestsDto) {
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
            location_name: true,
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

  protected buildWhere(query: getRequestsDto) {
    const where: Prisma.BorrowRequestsWhereInput = {};
    if (query.filter === 'status' && query.filterValue) {
      where.status = query.filterValue as BorrowStatus;
    } else if (query.filter && query.filterValue) {
      if (query.filter === 'requesterId') {
        where.requester_id = query.filterValue;
      } else if (query.filter === 'assetId') {
        where.asset_id = query.filterValue;
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
            location_name: true,
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
        asset_id: body.assetId,
        reason: body.reason,
        priority: body.priority,
      },
    });
  }

  async approveRequest(userId: string, requestId: string, assetId: string) {
    // update asset status
    await this.prisma.assets.update({
      where: { id: assetId },
      data: { status: 'IN_USE' },
    });

    return this.prisma.borrowRequests.update({
      where: { id: requestId, status: BorrowStatus.PENDING },
      data: {
        status: BorrowStatus.APPROVED,
        approved_at: new Date(),
        approved_by: userId,
      },
    });
  }

  async rejectRequest(requestId: string) {
    return this.prisma.borrowRequests.update({
      where: { id: requestId, status: BorrowStatus.PENDING },
      data: {
        status: BorrowStatus.REJECTED,
      },
    });
  }

  async provideRequest(userId: string, requestId: string) {
    return this.prisma.borrowRequests.update({
      where: { id: requestId, status: BorrowStatus.APPROVED },
      data: {
        status: BorrowStatus.PROVIDED,
        provided_at: new Date(),
        provided_by: userId,
      },
    });
  }

  async returnRequest(requestId: string, assetId: string) {
    // update asset status
    await this.prisma.assets.update({
      where: { id: assetId },
      data: { status: AssetStatus.READY },
    });
    return this.prisma.borrowRequests.update({
      where: {
        id: requestId,
        status: { in: [BorrowStatus.PROVIDED, BorrowStatus.OVERDUE] },
      },
      data: {
        status: BorrowStatus.RETURNED,
        returned_at: new Date(),
      },
    });
  }

  async cancelRequest(requestId: string) {
    return this.prisma.borrowRequests.update({
      where: {
        id: requestId,
        status: { in: [BorrowStatus.PENDING, BorrowStatus.APPROVED] },
      },
      data: {
        status: BorrowStatus.CANCELED,
      },
    });
  }
}
