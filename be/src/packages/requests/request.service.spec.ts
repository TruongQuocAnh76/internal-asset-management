import { ConflictException, NotFoundException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { Prisma } from '@prisma/client';
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

      await expect(service.createRequest(dto, 'user-1')).rejects.toThrow(
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

      await expect(service.createRequest(dto, 'user-1')).rejects.toThrow(
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
      } as CreateRequestDto;

      const res = await service.createRequest(dto, 'user-1');

      expect(prismaMock.borrowRequests.create).toHaveBeenCalledWith({
        data: {
          asset_id: dto.assetId,
          requester_id: dto.requesterId,
          reason: dto.reason,
          priority: dto.priority,
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

      await expect(service.createRequest(dto, 'user-2')).rejects.toThrow(
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

      await expect(service.createRequest(dto, 'user-2')).rejects.toThrow(
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
      } as CreateRequestDto;

      const res = await service.createRequest(dto, 'user-2');

      expect(prismaMock.borrowRequests.create).toHaveBeenCalledWith({
        data: {
          kit_id: dto.kitId,
          requester_id: dto.requesterId,
          reason: dto.reason,
          priority: dto.priority,
        },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          kit: { select: { template: { select: { name: true } } } },
        },
      });

      expect(res).toEqual(created);
    });
  });
});
