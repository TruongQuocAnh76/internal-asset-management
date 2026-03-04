import { Injectable } from '@nestjs/common';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { GetPurchaseRequestParam } from './dto/get-purchase-request-param.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { Prisma, PurchaseRequestStatus } from '@prisma/client';
import { CreateAssetDto } from '../assets/dto/create-asset.dto';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService,
  ) {}

  async getPurchaseRequests(query: GetPurchaseRequestParam) {
    const { filter, filterValue, order, orderBy, page = 1, limit = 20 } = query;

    const where: Prisma.PurchaseRequestWhereInput =
      filter === 'status' && filterValue ? { status: filterValue } : {};

    const [data, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        orderBy: orderBy
          ? { [orderBy]: order ?? 'asc' }
          : { requested_at: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
        include: {
          category: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPurchaseRequestById(id: string) {
    try {
      const purchaseRequest = await this.prisma.purchaseRequest.findUnique({
        where: { id },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });
      return purchaseRequest;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error('Purchase request not found');
      }
      throw error;
    }
  }

  async createPurchaseRequest(body: CreatePurchaseRequestDto) {
    return this.prisma.purchaseRequest.create({
      data: {
        reason: body.reason,
        estimated_cost: BigInt(body.estimatedCost),
        quantity: body.quantity,
        status: body.status,
        asset_category_id: body.category_id,
        requested_by: body.requested_by,
        specs: JSON.parse(JSON.stringify(body.specs)),
      },
    });
  }

  async tlApprove(id: string) {
    try {
      return await this.prisma.purchaseRequest.update({
        where: {
          id: id,
          status: PurchaseRequestStatus.SUBMITTED,
        },
        data: {
          status: PurchaseRequestStatus.TL_APPROVED,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error(
          'Purchase request not found or cannot be approved by TL',
        );
      }
      throw error;
    }
  }

  async bodApprove(id: string) {
    try {
      return await this.prisma.purchaseRequest.update({
        where: {
          id: id,
          status: PurchaseRequestStatus.TL_APPROVED,
        },
        data: {
          status: PurchaseRequestStatus.BOD_APPROVED,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error(
          'Purchase request not found or cannot be approved by BOD',
        );
      }
      throw error;
    }
  }

  async reject(id: string) {
    try {
      return await this.prisma.purchaseRequest.update({
        where: {
          id: id,
          status: {
            in: [
              PurchaseRequestStatus.SUBMITTED,
              PurchaseRequestStatus.TL_APPROVED,
            ],
          },
        },
        data: {
          status: PurchaseRequestStatus.REJECTED,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error('Purchase request not found or cannot be rejected');
      }
      throw error;
    }
  }

  async receive(id: string, body: CreateAssetDto) {
    return await this.prisma.$transaction(async (tx) => {
      try {
        await tx.purchaseRequest.update({
          where: {
            id: id,
            status: PurchaseRequestStatus.BOD_APPROVED,
          },
          data: {
            status: PurchaseRequestStatus.RECEIVED,
          },
        });

        return await this.assetsService.createAsset(
          body,
          tx as Prisma.TransactionClient,
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new Error(
            'Purchase request not found or cannot be marked as received',
          );
        }
        throw error;
      }
    });
  }
}
