import { Injectable } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { BorrowStatus } from '@prisma/client';

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

  async getRequests(status: BorrowStatus, asset_id: string, requester_id: string, filter: string, sort: string, page: number, limit: number) {
    return this.prisma.borrowRequests.findMany();
  }

  protected 

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

  async approveRequest(userId: string, requestId: string) {
    return this.prisma.borrowRequests.update({
      where: { id: requestId },
      data: {
        status: BorrowStatus.APPROVED,
        approved_at: new Date(),
        approved_by: userId,
      },
    });
  }

  async rejectRequest(requestId: string) {
    return this.prisma.borrowRequests.update({
      where: { id: requestId },
      data: {
        status: BorrowStatus.REJECTED,
      },
    });
  }

  async provideRequest(userId: string, requestId: string) {
    return this.prisma.borrowRequests.update({
      where: { id: requestId },
      data: {
        status: BorrowStatus.PROVIDED,
        provided_at: new Date(),
        provided_by: userId,
      },
    });
  }

  async returnRequest(requestId: string) {
    return this.prisma.borrowRequests.update({
      where: { id: requestId },
      data: {
        status: BorrowStatus.RETURNED,
        returned_at: new Date(),
      },
    });
  }

  async cancelRequest(requestId: string) {
    return this.prisma.borrowRequests.update({
      where: { id: requestId },
      data: {
        status: BorrowStatus.CANCELLED,
      },
    });
  }
}
