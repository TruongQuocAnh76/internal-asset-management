import { ConflictException, NotFoundException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { BorrowStatus } from '@prisma/client';
import { CreateRequestDto } from './dto/create-request.dto';
import { Entity } from 'src/core/enums/entity.enum';

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
    borrowRequests: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const auditServiceMock = {
    addRecord: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RequestsService(prismaMock as any, auditServiceMock as any);
  });

  describe('createRequest (asset)', () => {
    it('throws NotFoundException when asset does not exist', async () => {
      // arrange
      prismaMock.assets.findUnique.mockResolvedValue(null);

      const dto: CreateRequestDto = {
        assetId: 'asset-1',
        requesterId: 'user-1',
        reason: 'need it',
        priority: 'LOW' as any,
        kitId: undefined,
      };

      // act/assert
      await expect(service.createRequest(dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.assets.findUnique).toHaveBeenCalledWith({
        where: { id: dto.assetId },
      });
      expect(prismaMock.borrowRequests.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.borrowRequests.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when user already has an active request', async () => {
      // arrange
      prismaMock.assets.findUnique.mockResolvedValue({ id: 'asset-1' });
      prismaMock.borrowRequests.findFirst.mockResolvedValue({
        id: 'req-1',
        asset_id: 'asset-1',
      });

      const dto: CreateRequestDto = {
        assetId: 'asset-1',
        requesterId: 'user-1',
        reason: 'need it',
        priority: 'LOW' as any,
        kitId: undefined,
      };

      // act/assert
      await expect(service.createRequest(dto, 'user-1')).rejects.toThrow(
        ConflictException,
      );

      expect(prismaMock.borrowRequests.findFirst).toHaveBeenCalledWith({
        where: {
          asset_id: dto.assetId,
          requester_id: dto.requesterId,
          status: {
            in: [
              BorrowStatus.PENDING,
              BorrowStatus.APPROVED,
              BorrowStatus.PROVIDED,
            ],
          },
        },
      });

      expect(prismaMock.borrowRequests.create).not.toHaveBeenCalled();
    });

    it('creates request and writes audit on success', async () => {
      // arrange
      prismaMock.assets.findUnique.mockResolvedValue({ id: 'asset-1' });
      prismaMock.borrowRequests.findFirst.mockResolvedValue(null);
      const created = {
        id: 'req-xyz',
        asset_id: 'asset-1',
        requester_id: 'user-1',
      };
      prismaMock.borrowRequests.create.mockResolvedValue(created);

      const dto: CreateRequestDto = {
        assetId: 'asset-1',
        requesterId: 'user-1',
        reason: 'need it',
        priority: 'LOW' as any,
        kitId: undefined,
      };

      // act
      const res = await service.createRequest(dto, 'user-1');

      // assert
      expect(prismaMock.borrowRequests.create).toHaveBeenCalledWith({
        data: {
          asset_id: dto.assetId,
          requester_id: dto.requesterId,
          reason: dto.reason,
          priority: dto.priority,
        },
      });

      expect(auditServiceMock.addRecord).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.addRecord).toHaveBeenCalledWith(
        'user-1',
        'CREATE',
        Entity.BORROW_REQUEST,
        created.id,
        JSON.stringify({}),
        JSON.stringify(dto),
      );

      expect(res).toEqual(created);
    });
  });

  describe('createKitRequest', () => {
    it('throws NotFoundException when kit does not exist', async () => {
      prismaMock.assetsKits.findUnique.mockResolvedValue(null);

      const dto: CreateRequestDto = {
        assetId: undefined,
        kitId: 'kit-1',
        requesterId: 'user-2',
        reason: 'for testing',
        priority: 'LOW' as any,
      };

      await expect(service.createKitRequest(dto, 'user-2')).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.assetsKits.findUnique).toHaveBeenCalledWith({
        where: { id: dto.kitId },
      });
      expect(prismaMock.borrowRequests.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.borrowRequests.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when user already requested same kit', async () => {
      prismaMock.assetsKits.findUnique.mockResolvedValue({ id: 'kit-1' });
      prismaMock.borrowRequests.findFirst.mockResolvedValue({ id: 'req-1' });

      const dto: CreateRequestDto = {
        assetId: undefined,
        kitId: 'kit-1',
        requesterId: 'user-2',
        reason: 'for testing',
        priority: 'LOW' as any,
      };

      await expect(service.createKitRequest(dto, 'user-2')).rejects.toThrow(
        ConflictException,
      );

      expect(prismaMock.borrowRequests.findFirst).toHaveBeenCalledWith({
        where: {
          kit_id: dto.kitId,
          requester_id: dto.requesterId,
          status: {
            in: [
              BorrowStatus.PENDING,
              BorrowStatus.APPROVED,
              BorrowStatus.PROVIDED,
            ],
          },
        },
      });

      expect(prismaMock.borrowRequests.create).not.toHaveBeenCalled();
    });

    it('creates kit request and writes audit on success', async () => {
      prismaMock.assetsKits.findUnique.mockResolvedValue({ id: 'kit-1' });
      prismaMock.borrowRequests.findFirst.mockResolvedValue(null);

      const created = {
        id: 'req-kit-1',
        kit_id: 'kit-1',
        requester_id: 'user-2',
      };
      prismaMock.borrowRequests.create.mockResolvedValue(created);

      const dto: CreateRequestDto = {
        assetId: undefined,
        kitId: 'kit-1',
        requesterId: 'user-2',
        reason: 'for testing',
        priority: 'LOW' as any,
      };

      const res = await service.createKitRequest(dto, 'user-2');

      expect(prismaMock.borrowRequests.create).toHaveBeenCalledWith({
        data: {
          kit_id: dto.kitId,
          requester_id: dto.requesterId,
          reason: dto.reason,
          priority: dto.priority,
        },
      });

      expect(auditServiceMock.addRecord).toHaveBeenCalledWith(
        'user-2',
        'CREATE',
        Entity.BORROW_REQUEST,
        created.id,
        JSON.stringify({}),
        JSON.stringify(dto),
      );

      expect(res).toEqual(created);
    });
  });
});
