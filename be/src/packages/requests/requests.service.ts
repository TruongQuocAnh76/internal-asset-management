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
import { AuditService } from 'src/core/audit/audit.service';
import { Entity } from 'src/core/enums/entity.enum';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createRequest(body: CreateRequestDto, userId: string) {
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
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });

    const updatedRequest = await this.prisma.borrowRequests.updateMany({
      where: { id: requestId, requester_id: userId },
      data: {
        asset_id: body.assetId,
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

  async approveRequest(userId: string, requestId: string, assetId: string) {
    // Get before state
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });
    const beforeAsset = await this.prisma.assets.findUnique({
      where: { id: assetId },
    });

    // update asset status
    await this.prisma.assets.update({
      where: { id: assetId },
      data: { status: 'IN_USE' },
    });

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
      Entity.ASSET,
      assetId,
      JSON.stringify(beforeAsset),
      JSON.stringify({ status: 'IN_USE' }),
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

  async returnRequest(requestId: string, assetId: string, userId: string) {
    // Get before state
    const beforeRequest = await this.prisma.borrowRequests.findUnique({
      where: { id: requestId },
    });
    const beforeAsset = await this.prisma.assets.findUnique({
      where: { id: assetId },
    });

    // update asset status
    await this.prisma.assets.update({
      where: { id: assetId },
      data: { status: AssetStatus.READY },
    });

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
      Entity.ASSET,
      assetId,
      JSON.stringify(beforeAsset),
      JSON.stringify({ status: AssetStatus.READY }),
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
}
