import { ConflictException, NotFoundException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ItemStatus, Prisma } from '@prisma/client';
import { CreateRequestDto } from './dto/create-request.dto';

describe('RequestsService', () => {
  let service: RequestsService;

  const prismaMock: any = {
    assets: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    assetsKits: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    assetItems: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    borrowRequests: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    users: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };

  const notificationQueueMock: any = {
    add: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RequestsService(prismaMock as any, notificationQueueMock as any);
  });

  describe('createRequest (asset)', () => {
    it('throws NotFoundException when asset does not exist (P2025)', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('FK constraint', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });
      prismaMock.borrowRequests.create.mockRejectedValue(error);

      const dto = {
        assetId: 'asset-1',
        requesterId: 'user-1',
        reason: 'need it',
        priority: 'LOW',
      } as CreateRequestDto;

      await expect(service.createRequest(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException on duplicate active request (P2002)', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      prismaMock.borrowRequests.create.mockRejectedValue(error);

      const dto = {
        assetId: 'asset-1',
        requesterId: 'user-1',
        reason: 'need it',
        priority: 'LOW',
      } as CreateRequestDto;

      await expect(service.createRequest(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates request on success', async () => {
      const created = {
        id: 'req-xyz',
        asset_id: 'asset-1',
        requester_id: 'user-1',
      };
      prismaMock.borrowRequests.create.mockResolvedValue(created);

      const dto = {
        assetId: 'asset-1',
        requesterId: 'user-1',
        reason: 'need it',
        priority: 'LOW',
        dueDate: '2026-04-01',
      } as CreateRequestDto;

      const res = await service.createRequest(dto);

      expect(prismaMock.borrowRequests.create).toHaveBeenCalledWith({
        data: {
          asset_id: dto.assetId,
          requester_id: dto.requesterId,
          reason: dto.reason,
          priority: dto.priority,
          due_date: new Date('2026-04-01'),
        },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          asset: { select: { name: true } },
        },
      });

      expect(res).toEqual(created);
    });
  });

  describe('createRequest (kit)', () => {
    it('throws NotFoundException when kit does not exist (P2025)', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('FK constraint', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });
      prismaMock.borrowRequests.create.mockRejectedValue(error);

      const dto = {
        kitId: 'kit-1',
        requesterId: 'user-2',
        reason: 'for testing',
        priority: 'LOW',
      } as CreateRequestDto;

      await expect(service.createRequest(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException on duplicate active kit request (P2002)', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      prismaMock.borrowRequests.create.mockRejectedValue(error);

      const dto = {
        kitId: 'kit-1',
        requesterId: 'user-2',
        reason: 'for testing',
        priority: 'LOW',
      } as CreateRequestDto;

      await expect(service.createRequest(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates kit request on success', async () => {
      const created = {
        id: 'req-kit-1',
        kit_id: 'kit-1',
        requester_id: 'user-2',
      };
      prismaMock.borrowRequests.create.mockResolvedValue(created);

      const dto = {
        kitId: 'kit-1',
        requesterId: 'user-2',
        reason: 'for testing',
        priority: 'LOW',
        dueDate: '2026-04-01',
      } as CreateRequestDto;

      const res = await service.createRequest(dto);

      expect(prismaMock.borrowRequests.create).toHaveBeenCalledWith({
        data: {
          kit_id: dto.kitId,
          requester_id: dto.requesterId,
          reason: dto.reason,
          priority: dto.priority,
          due_date: new Date('2026-04-01'),
        },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          kit: { select: { template: { select: { name: true } } } },
        },
      });

      expect(res).toEqual(created);
    });
  });

  // computeNewAssetStatus was removed: asset status is now TemplateStatus
  // (AVAILABLE/UNAVAILABLE). Recomputation lives in AssetsService.recomputeAssetStatus.
  xdescribe('computeNewAssetStatus', () => {
    const compute = (
      assetId: string,
      currentStatus: ItemStatus | null,
      updateStatus: ItemStatus,
      deletedStatus?: ItemStatus,
    ) =>
      (service as any).computeNewAssetStatus(
        assetId,
        currentStatus,
        updateStatus,
        undefined,
        deletedStatus,
      ) as Promise<ItemStatus | null>;

    it('returns READY when updateStatus is READY (normal update, 0 queries)', async () => {
      const result = await compute(
        'asset-1',
        ItemStatus.IN_USE,
        ItemStatus.READY,
      );

      expect(result).toBe(ItemStatus.READY);
      expect(prismaMock.assetItems.count).not.toHaveBeenCalled();
    });

    it('returns IN_USE when current non-READY uniform state is broken (normal update)', async () => {
      const result = await compute(
        'asset-1',
        ItemStatus.BROKEN,
        ItemStatus.LIQUIDATED,
      );

      expect(result).toBe(ItemStatus.IN_USE);
      expect(prismaMock.assetItems.count).not.toHaveBeenCalled();
    });

    it('returns READY when current is READY and there is still a READY item', async () => {
      prismaMock.assetItems.count.mockResolvedValueOnce(2);

      const result = await compute(
        'asset-1',
        ItemStatus.READY,
        ItemStatus.IN_USE,
      );

      expect(result).toBe(ItemStatus.READY);
      expect(prismaMock.assetItems.count).toHaveBeenCalledWith({
        where: { asset_id: 'asset-1', status: ItemStatus.READY },
      });
    });

    it('returns updateStatus when current is READY and all remaining items match updateStatus', async () => {
      prismaMock.assetItems.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await compute(
        'asset-1',
        ItemStatus.READY,
        ItemStatus.BROKEN,
      );

      expect(result).toBe(ItemStatus.BROKEN);
      expect(prismaMock.assetItems.count).toHaveBeenNthCalledWith(2, {
        where: { asset_id: 'asset-1', status: { not: ItemStatus.BROKEN } },
      });
    });

    it('returns IN_USE when current is IN_USE and remaining items are mixed', async () => {
      prismaMock.assetItems.count.mockResolvedValueOnce(3);

      const result = await compute(
        'asset-1',
        ItemStatus.IN_USE,
        ItemStatus.MAINTAINANCE,
      );

      expect(result).toBe(ItemStatus.IN_USE);
      expect(prismaMock.assetItems.count).toHaveBeenCalledWith({
        where: {
          asset_id: 'asset-1',
          status: { not: ItemStatus.MAINTAINANCE },
        },
      });
    });

    it('deletion: returns READY when a READY item is deleted but another READY remains', async () => {
      prismaMock.assetItems.count.mockResolvedValueOnce(1);

      const result = await compute(
        'asset-1',
        ItemStatus.READY,
        ItemStatus.IN_USE,
        ItemStatus.READY,
      );

      expect(result).toBe(ItemStatus.READY);
      expect(prismaMock.assetItems.findMany).not.toHaveBeenCalled();
    });

    it('deletion: returns remaining single distinct status when READY deleted and no READY left', async () => {
      prismaMock.assetItems.count.mockResolvedValueOnce(0);
      prismaMock.assetItems.findMany.mockResolvedValueOnce([
        { status: ItemStatus.BROKEN },
      ]);

      const result = await compute(
        'asset-1',
        ItemStatus.READY,
        ItemStatus.IN_USE,
        ItemStatus.READY,
      );

      expect(result).toBe(ItemStatus.BROKEN);
      expect(prismaMock.assetItems.findMany).toHaveBeenCalledWith({
        where: { asset_id: 'asset-1' },
        select: { status: true },
        distinct: ['status'],
      });
    });

    it('deletion: returns LIQUIDATED when deleting from uniform non-READY leaves no items', async () => {
      prismaMock.assetItems.count.mockResolvedValueOnce(0);

      const result = await compute(
        'asset-1',
        ItemStatus.BROKEN,
        ItemStatus.IN_USE,
        ItemStatus.BROKEN,
      );

      expect(result).toBe(ItemStatus.LIQUIDATED);
    });

    it('deletion: returns deletedStatus when current IN_USE becomes uniform after deletion', async () => {
      prismaMock.assetItems.count.mockResolvedValueOnce(0);

      const result = await compute(
        'asset-1',
        ItemStatus.IN_USE,
        ItemStatus.IN_USE,
        ItemStatus.MAINTAINANCE,
      );

      expect(result).toBe(ItemStatus.MAINTAINANCE);
      expect(prismaMock.assetItems.count).toHaveBeenCalledWith({
        where: {
          asset_id: 'asset-1',
          status: { not: ItemStatus.MAINTAINANCE },
        },
      });
    });

    it('loads current status from DB when currentStatus is null', async () => {
      prismaMock.assets.findUnique.mockResolvedValueOnce({
        status: ItemStatus.READY,
      });
      prismaMock.assetItems.count.mockResolvedValueOnce(1);

      const result = await compute('asset-1', null, ItemStatus.IN_USE);

      expect(result).toBe(ItemStatus.READY);
      expect(prismaMock.assets.findUnique).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        select: { status: true },
      });
    });

    it('returns null when currentStatus is null and asset does not exist', async () => {
      prismaMock.assets.findUnique.mockResolvedValueOnce(null);

      const result = await compute('missing-asset', null, ItemStatus.IN_USE);

      expect(result).toBeNull();
    });
  });
});
