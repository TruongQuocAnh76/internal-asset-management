import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseRequestsService } from './purchase-requests.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { Prisma, PurchaseRequestStatus } from '@prisma/client';

const prismaMock = {
  purchaseRequest: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const assetsServiceMock = {
  createAsset: jest.fn(),
};

describe('PurchaseRequestsService', () => {
  let service: PurchaseRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AssetsService, useValue: assetsServiceMock },
      ],
    }).compile();

    service = module.get<PurchaseRequestsService>(PurchaseRequestsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getPurchaseRequests ───────────────────────────────────────────────────

  describe('getPurchaseRequests', () => {
    const mockData = [{ id: 'pr-1', status: PurchaseRequestStatus.SUBMITTED }];

    it('returns paginated data with defaults', async () => {
      prismaMock.purchaseRequest.findMany.mockResolvedValue(mockData);
      prismaMock.purchaseRequest.count.mockResolvedValue(1);

      const result = await service.getPurchaseRequests({});

      expect(prismaMock.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 20,
          orderBy: { requested_at: 'desc' },
        }),
      );
      expect(result).toEqual({
        data: mockData,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
    });

    it('applies status filter when filter and filterValue are provided', async () => {
      prismaMock.purchaseRequest.findMany.mockResolvedValue(mockData);
      prismaMock.purchaseRequest.count.mockResolvedValue(1);

      await service.getPurchaseRequests({
        filter: 'status',
        filterValue: PurchaseRequestStatus.SUBMITTED,
      });

      expect(prismaMock.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: PurchaseRequestStatus.SUBMITTED },
        }),
      );
    });

    it('ignores filter when filterValue is absent', async () => {
      prismaMock.purchaseRequest.findMany.mockResolvedValue([]);
      prismaMock.purchaseRequest.count.mockResolvedValue(0);

      await service.getPurchaseRequests({ filter: 'status' });

      expect(prismaMock.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('applies custom orderBy and order', async () => {
      prismaMock.purchaseRequest.findMany.mockResolvedValue([]);
      prismaMock.purchaseRequest.count.mockResolvedValue(0);

      await service.getPurchaseRequests({ orderBy: 'status', order: 'desc' });

      expect(prismaMock.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { status: 'desc' } }),
      );
    });

    it('defaults order to asc when orderBy is set but order is absent', async () => {
      prismaMock.purchaseRequest.findMany.mockResolvedValue([]);
      prismaMock.purchaseRequest.count.mockResolvedValue(0);

      await service.getPurchaseRequests({ orderBy: 'requested_at' });

      expect(prismaMock.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { requested_at: 'asc' } }),
      );
    });

    it('calculates skip correctly for page 2', async () => {
      prismaMock.purchaseRequest.findMany.mockResolvedValue([]);
      prismaMock.purchaseRequest.count.mockResolvedValue(25);

      const result = await service.getPurchaseRequests({ page: 2, limit: 10 });

      expect(prismaMock.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
    });
  });

  // ─── createPurchaseRequest ─────────────────────────────────────────────────

  describe('createPurchaseRequest', () => {
    it('creates a purchase request with correct data', async () => {
      const created = { id: 'pr-new' };
      prismaMock.purchaseRequest.create.mockResolvedValue(created);

      const body = {
        requested_by: 'user-1',
        category_id: 'cat-1',
        reason: 'Test reason',
        estimatedCost: BigInt(5000),
        quantity: 2,
        status: PurchaseRequestStatus.SUBMITTED,
        specs: { ram: '16GB' },
      };

      const result = await service.createPurchaseRequest(body);

      expect(prismaMock.purchaseRequest.create).toHaveBeenCalledWith({
        data: {
          reason: body.reason,
          estimated_cost: body.estimatedCost,
          quantity: body.quantity,
          status: body.status,
          asset_category_id: body.category_id,
          requested_by: body.requested_by,
          specs: body.specs,
        },
      });
      expect(result).toEqual(created);
    });
  });

  // ─── tlApprove ─────────────────────────────────────────────────────────────

  describe('tlApprove', () => {
    it('updates status to TL_APPROVED', async () => {
      const updated = { id: 'pr-1', status: PurchaseRequestStatus.TL_APPROVED };
      prismaMock.purchaseRequest.update.mockResolvedValue(updated);

      const result = await service.tlApprove('pr-1');

      expect(prismaMock.purchaseRequest.update).toHaveBeenCalledWith({
        where: { id: 'pr-1', status: PurchaseRequestStatus.SUBMITTED },
        data: { status: PurchaseRequestStatus.TL_APPROVED },
      });
      expect(result).toEqual(updated);
    });

    it('throws a descriptive error on P2025', async () => {
      const p2025 = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '0',
      });
      prismaMock.purchaseRequest.update.mockRejectedValue(p2025);

      await expect(service.tlApprove('pr-1')).rejects.toThrow(
        'Purchase request not found or cannot be approved by TL',
      );
    });

    it('rethrows unknown errors', async () => {
      const err = new Error('DB connection lost');
      prismaMock.purchaseRequest.update.mockRejectedValue(err);

      await expect(service.tlApprove('pr-1')).rejects.toThrow('DB connection lost');
    });
  });

  // ─── bodApprove ────────────────────────────────────────────────────────────

  describe('bodApprove', () => {
    it('updates status to BOD_APPROVED', async () => {
      const updated = { id: 'pr-1', status: PurchaseRequestStatus.BOD_APPROVED };
      prismaMock.purchaseRequest.update.mockResolvedValue(updated);

      const result = await service.bodApprove('pr-1');

      expect(prismaMock.purchaseRequest.update).toHaveBeenCalledWith({
        where: { id: 'pr-1', status: PurchaseRequestStatus.TL_APPROVED },
        data: { status: PurchaseRequestStatus.BOD_APPROVED },
      });
      expect(result).toEqual(updated);
    });

    it('throws a descriptive error on P2025', async () => {
      const p2025 = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '0',
      });
      prismaMock.purchaseRequest.update.mockRejectedValue(p2025);

      await expect(service.bodApprove('pr-1')).rejects.toThrow(
        'Purchase request not found or cannot be approved by BOD',
      );
    });
  });

  // ─── reject ────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('updates status to REJECTED for SUBMITTED request', async () => {
      const updated = { id: 'pr-1', status: PurchaseRequestStatus.REJECTED };
      prismaMock.purchaseRequest.update.mockResolvedValue(updated);

      const result = await service.reject('pr-1');

      expect(prismaMock.purchaseRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'pr-1',
          status: {
            in: [PurchaseRequestStatus.SUBMITTED, PurchaseRequestStatus.TL_APPROVED],
          },
        },
        data: { status: PurchaseRequestStatus.REJECTED },
      });
      expect(result).toEqual(updated);
    });

    it('throws a descriptive error on P2025', async () => {
      const p2025 = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '0',
      });
      prismaMock.purchaseRequest.update.mockRejectedValue(p2025);

      await expect(service.reject('pr-1')).rejects.toThrow(
        'Purchase request not found or cannot be rejected',
      );
    });
  });

  // ─── receive ───────────────────────────────────────────────────────────────

  describe('receive', () => {
    const assetBody = {
      name: 'Laptop',
      category_name: 'Electronics',
      image_num: 0,
      initial_quantity: 1,
      costs: 3000,
    } as any;

    it('marks request as RECEIVED and creates the asset within a transaction', async () => {
      const txMock = {
        purchaseRequest: { update: jest.fn().mockResolvedValue({ id: 'pr-1' }) },
      };
      prismaMock.$transaction.mockImplementation((fn) => fn(txMock));
      assetsServiceMock.createAsset.mockResolvedValue({ createdAsset: { id: 'a-1' }, tempImageUrls: [] });

      await service.receive('pr-1', assetBody);

      expect(txMock.purchaseRequest.update).toHaveBeenCalledWith({
        where: { id: 'pr-1', status: PurchaseRequestStatus.BOD_APPROVED },
        data: { status: PurchaseRequestStatus.RECEIVED },
      });
      expect(assetsServiceMock.createAsset).toHaveBeenCalledWith(
        assetBody,
        txMock,
      );
    });

    it('throws a descriptive error when request is not in BOD_APPROVED state (P2025)', async () => {
      const p2025 = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '0',
      });
      const txMock = {
        purchaseRequest: { update: jest.fn().mockRejectedValue(p2025) },
      };
      prismaMock.$transaction.mockImplementation((fn) => fn(txMock));

      await expect(service.receive('pr-1', assetBody)).rejects.toThrow(
        'Purchase request not found or cannot be marked as received',
      );
    });

    it('rethrows non-P2025 errors from within the transaction', async () => {
      const err = new Error('Unexpected failure');
      const txMock = {
        purchaseRequest: { update: jest.fn().mockRejectedValue(err) },
      };
      prismaMock.$transaction.mockImplementation((fn) => fn(txMock));

      await expect(service.receive('pr-1', assetBody)).rejects.toThrow(
        'Unexpected failure',
      );
    });
  });
});
