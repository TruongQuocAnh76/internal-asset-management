import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus, DepreciationMethod, Prisma } from '@prisma/client';
import { EditAssetDto } from './dto/edit-asset.dto';
import { StorageService } from 'src/core/storage/storage.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: PrismaService;

  const prismaMock = {
    assets: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    assetItems: {
      count: jest.fn(),
      createManyAndReturn: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    assetsKits: {
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    assetsCategories: {
      findFirst: jest.fn(),
    },
    $executeRawUnsafe: jest.fn().mockResolvedValue(0),
    $transaction: jest.fn().mockImplementation((fn) => fn(prismaMock)),
  };

  const storageServiceMock = {
    getPresignedUploadUrl: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: StorageService,
          useValue: storageServiceMock,
        },
      ],
    }).compile();

    service = module.get(AssetsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('builds where clause for category filter', () => {
    const where = (service as any).buildWhere({
      filter: 'category',
      filterValue: 'Laptop',
    });

    expect(where).toEqual({
      category: {
        name: 'Laptop',
      },
    });
  });

  it('builds where clause for status filter', () => {
    const where = (service as any).buildWhere({
      filter: 'status',
      filterValue: 'READY',
    });

    expect(where).toEqual({
      status: AssetStatus.READY,
    });
  });

  it('builds where clause for acquired_at filter', () => {
    const date = '2024-01-01';

    const where = (service as any).buildWhere({
      filter: 'acquired_at',
      filterValue: date,
    });

    expect(where.acquired_at).toBeInstanceOf(Date);
    expect(where.acquired_at?.toISOString()).toContain('2024-01-01');
  });

  it('adds search OR condition', () => {
    const where = (service as any).buildWhere({
      search: 'ASSET001',
    });

    expect(where).toEqual({
      OR: [
        {
          name: { contains: 'ASSET001', mode: 'insensitive' },
        },
        {
          code: { contains: 'ASSET001', mode: 'insensitive' },
        },
      ],
    });
  });

  it('combines filter and search correctly', () => {
    const where = (service as any).buildWhere({
      filter: 'status',
      filterValue: 'READY',
      search: 'LAP',
    });

    expect(where).toEqual({
      status: AssetStatus.READY,
      OR: [
        {
          name: { contains: 'LAP', mode: 'insensitive' },
        },
        {
          code: { contains: 'LAP', mode: 'insensitive' },
        },
      ],
    });
  });

  it('uses defaults when optional params are missing', async () => {
    prismaMock.assets.findMany.mockResolvedValue([]);
    prismaMock.assets.count.mockResolvedValue(0);

    await service.getAssets({});

    expect(prisma.assets.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 20,
        orderBy: undefined,
      }),
    );
  });

  it('should update asset with valid partial data', async () => {
    const id = 'asset-id';
    const body: EditAssetDto = {
      category_name: 'New name',
    };

    prisma.assets.update.mockResolvedValue({
      id,
      category_name: 'New name',
      costs: 1000,
    });

    prisma.assets.findUnique.mockResolvedValue({
      id,
      category_name: 'Old name',
      costs: 1000,
    });

    prisma.assetsCategories.findFirst.mockResolvedValue({
      id: 'cat-1',
      name: 'New name',
      code: 'NEW',
    });

    const result = await service.updateAsset(id, body);

    expect(prismaMock.assets.update).toHaveBeenCalledWith({
      where: { id },
      data: expect.objectContaining({
        category_id: 'cat-1',
      }),
    });

    expect(result).toEqual({
      id,
      category_name: 'New name',
      costs: 1000,
    });
  });

  it('should update asset with multiple fields', async () => {
    const id = 'asset-id';
    const userId = 'user-1';

    const body: EditAssetDto = {
      category_name: 'Laptop',
      costs: 1200,
    };

    prisma.assets.findUnique.mockResolvedValue({
      id,
      costs: 1000,
    });

    prisma.assetsCategories.findFirst.mockResolvedValue({
      id: 'cat-2',
      name: 'Laptop',
      code: 'LAP',
    });

    prisma.assets.update.mockResolvedValue({
      id,
      category_id: 'cat-2',
      costs: 1200,
    });

    const result = await service.updateAsset(id, body, userId);

    expect(prismaMock.assets.update).toHaveBeenCalledWith({
      where: { id },
      data: expect.objectContaining({
        category_id: 'cat-2',
      }),
    });

    expect(result.costs).toBe(1200);
  });

  // --- getAssets with stock from asset_items ---

  it('should return assets with stock from _count.asset_items', async () => {
    prismaMock.assets.findMany.mockResolvedValue([
      {
        id: 'a1',
        code: 'laptop_001',
        name: 'Laptop',
        category: { name: 'Electronics' },
        status: 'READY',
        image_urls: [],
        costs: BigInt(1500),
        acquired_at: new Date('2024-01-01'),
        _count: { asset_items: 3 },
      },
    ] as any);
    prismaMock.assets.count.mockResolvedValue(1);

    const result = await service.getAssets({});

    expect(result.data[0].stock).toBe(3);
  });

  // --- getAssetById with asset_items ---

  it('should return asset with items and stock', async () => {
    prismaMock.assets.findUnique.mockResolvedValue({
      id: 'a1',
      code: 'laptop_001',
      name: 'Laptop',
      category: { name: 'Electronics' },
      asset_specs: { specs: {} },
      status: 'READY',
      costs: BigInt(2000),
      image_urls: [],
      acquired_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      asset_items: [
        {
          id: 'item-1',
          status: 'READY',
          location_name: 'Room A',
          costs: BigInt(2000),
          acquired_at: new Date(),
          kit_id: null,
          kit_status: false,
        },
        {
          id: 'item-2',
          status: 'IN_USE',
          location_name: 'Room B',
          costs: null,
          acquired_at: new Date(),
          kit_id: null,
          kit_status: false,
        },
      ],
      _count: { asset_items: 2 },
      borrow_requests: [],
    } as any);

    const result = await service.getAssetById('a1');

    expect(result.stock).toBe(2);
    expect(result.asset_items).toHaveLength(2);
    expect(result.asset_items[0].costs).toBe(2000);
    expect(result.asset_items[1].costs).toBeNull();
  });

  it('should throw if asset not found in getAssetById', async () => {
    prismaMock.assets.findUnique.mockResolvedValue(null);

    await expect(service.getAssetById('non-existent')).rejects.toThrow(
      'Asset not found',
    );
  });

  // --- getSummary ---

  it('should return summary with item counts', async () => {
    prismaMock.assets.count.mockResolvedValue(10);
    prismaMock.assetItems.count
      .mockResolvedValueOnce(25)
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    const result = await service.getSummary();

    expect(result.countAllAssets).toBe(10);
    expect(result.countAllItems).toBe(25);
    expect(result.byItemStatus.countItemsReady).toBe(15);
    expect(result.byItemStatus.countItemsInUse).toBe(5);
    expect(result.byItemStatus.countItemsMaintenance).toBe(2);
    expect(result.byItemStatus.countItemsBroken).toBe(2);
    expect(result.byItemStatus.countItemsLiquidated).toBe(1);
  });

  // --- adjustAssetStock ---

  it('should add asset items when adjusting stock with positive value', async () => {
    prismaMock.assetItems.createManyAndReturn.mockResolvedValue([
      { id: 'item-1', asset_id: 'a1' },
      { id: 'item-2', asset_id: 'a1' },
    ] as any);

    prismaMock.assets.update.mockResolvedValue({} as any);
    prismaMock.assetItems.count.mockResolvedValue(2);

    const result = await (service as any).adjustAssetStock('a1', 2);

    expect(prismaMock.assetItems.createManyAndReturn).toHaveBeenCalledWith({
      data: [{ asset_id: 'a1' }, { asset_id: 'a1' }],
    });
    expect(result).toHaveLength(2);
  });

  it('should remove READY asset items when adjusting stock with negative value', async () => {
    prismaMock.assetItems.findMany.mockResolvedValue([
      { id: 'item-1' },
      { id: 'item-2' },
    ] as any);

    prismaMock.assetItems.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.assets.update.mockResolvedValue({} as any);
    prismaMock.assetItems.count.mockResolvedValue(0);

    const result = await (service as any).adjustAssetStock('a1', -2);

    expect(prismaMock.assetItems.findMany).toHaveBeenCalledWith({
      where: {
        asset_id: 'a1',
        status: 'READY',
        kit_id: null,
      },
      take: 2,
      orderBy: { created_at: 'asc' },
    });
    expect(prismaMock.assetItems.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['item-1', 'item-2'] } },
    });
    expect(result).toEqual({ removed: 2 });
  });

  it('should throw if not enough READY items to remove', async () => {
    prismaMock.assetItems.findMany.mockResolvedValue([{ id: 'item-1' }] as any);

    await expect((service as any).adjustAssetStock('a1', -3)).rejects.toThrow(
      'Cannot remove 3 items. Only 1 available READY items found.',
    );
  });

  it('should return no adjustment message when value is 0', async () => {
    const result = await (service as any).adjustAssetStock('a1', 0);

    expect(result).toEqual({ message: 'No stock adjustment needed' });
  });

  it('should throw if asset not found in adjustAssetStock', async () => {
    const p2025 = Object.assign(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '0',
      }),
    );
    prismaMock.assetItems.createManyAndReturn.mockRejectedValue(p2025);

    await expect(
      (service as any).adjustAssetStock('non-existent', 1),
    ).rejects.toThrow('Asset not found');
  });

  // -------------------------
  // computeDepreciation (pure)
  // -------------------------

  describe('computeDepreciation', () => {
    it('returns same cost when already at or below salvage value', () => {
      const result = service.computeDepreciation({
        costs: BigInt(500),
        salvage_value: BigInt(500),
        depreciation_method: DepreciationMethod.STRAIGHT_LINE,
        life_months: 12,
      });
      expect(result).toBe(BigInt(500));
    });

    it('calculates straight-line monthly depreciation correctly', () => {
      // (1200 - 0) / 12 = 100 → 1200 - 100 = 1100
      const result = service.computeDepreciation({
        costs: BigInt(1200),
        salvage_value: BigInt(0),
        life_months: 12,
        depreciation_method: DepreciationMethod.STRAIGHT_LINE,
      });
      expect(result).toBe(BigInt(1100));
    });

    it('floors straight-line result at salvage_value', () => {
      // (110 - 100) / 12 = 0 (integer division) → no change? — use bigger spread
      // (600 - 100) / 6 = 83 → 600 - 83 = 517, but let's test floor:
      // life_months = 1 → (200 - 150) / 1 = 50 → 200 - 50 = 150 == salvage
      const result = service.computeDepreciation({
        costs: BigInt(200),
        salvage_value: BigInt(150),
        life_months: 1,
        depreciation_method: DepreciationMethod.STRAIGHT_LINE,
      });
      expect(result).toBe(BigInt(150));
    });

    it('returns original cost when life_months is 0 (straight-line)', () => {
      const result = service.computeDepreciation({
        costs: BigInt(1000),
        salvage_value: BigInt(100),
        life_months: 0,
        depreciation_method: DepreciationMethod.STRAIGHT_LINE,
      });
      expect(result).toBe(BigInt(1000));
    });

    it('calculates declining-balance monthly depreciation correctly', () => {
      // 1000 * 10 / 100 = 100 → 1000 - 100 = 900
      const result = service.computeDepreciation({
        costs: BigInt(1000),
        salvage_value: BigInt(0),
        decline_balance_rate: 10,
        depreciation_method: DepreciationMethod.DECLINNING_BALANCE,
      });
      expect(result).toBe(BigInt(900));
    });

    it('floors declining-balance result at salvage_value', () => {
      // 1000 * 90 / 100 = 900 → 1000 - 900 = 100 == salvage
      const result = service.computeDepreciation({
        costs: BigInt(1000),
        salvage_value: BigInt(200),
        decline_balance_rate: 90,
        depreciation_method: DepreciationMethod.DECLINNING_BALANCE,
      });
      expect(result).toBe(BigInt(200));
    });

    it('returns original cost when decline_balance_rate is 0', () => {
      const result = service.computeDepreciation({
        costs: BigInt(1000),
        salvage_value: BigInt(0),
        decline_balance_rate: 0,
        depreciation_method: DepreciationMethod.DECLINNING_BALANCE,
      });
      expect(result).toBe(BigInt(1000));
    });

    it('defaults salvage_value to 0 when not provided', () => {
      // (1200) / 12 = 100 → 1200 - 100 = 1100
      const result = service.computeDepreciation({
        costs: BigInt(1200),
        life_months: 12,
        depreciation_method: DepreciationMethod.STRAIGHT_LINE,
      });
      expect(result).toBe(BigInt(1100));
    });
  });

  // -------------------------
  // applyMonthlyDepreciation
  // -------------------------

  describe('applyMonthlyDepreciation', () => {
    it('returns 0 when there are no eligible items', async () => {
      prismaMock.assetItems.findMany.mockResolvedValueOnce([]);

      const result = await service.applyMonthlyDepreciation();

      expect(result).toBe(0);
      expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
    });

    it('skips items already at or below salvage value', async () => {
      prismaMock.assetItems.findMany
        .mockResolvedValueOnce([
          {
            id: 'item-1',
            costs: BigInt(500),
            acquired_at: new Date(),
            asset: {
              salvage_value: BigInt(500),
              life_months: 12,
              decline_balance_rate: null,
              depreciation_method: DepreciationMethod.STRAIGHT_LINE,
            },
          },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.applyMonthlyDepreciation();

      expect(result).toBe(1);
      expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
    });

    it('batch-updates costs for straight-line depreciation', async () => {
      prismaMock.assetItems.findMany
        .mockResolvedValueOnce([
          {
            id: 'item-1',
            costs: BigInt(1200),
            acquired_at: new Date(),
            asset: {
              salvage_value: BigInt(0),
              life_months: 12,
              decline_balance_rate: null,
              depreciation_method: DepreciationMethod.STRAIGHT_LINE,
            },
          },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.applyMonthlyDepreciation();

      expect(result).toBe(1);
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledTimes(1);
      const sql: string = prismaMock.$executeRawUnsafe.mock.calls[0][0];
      // newCost = 1200 - (1200/12) = 1100
      expect(sql).toContain('1100');
      expect(sql).toContain('item-1');
    });

    it('batch-updates costs for declining-balance depreciation', async () => {
      prismaMock.assetItems.findMany
        .mockResolvedValueOnce([
          {
            id: 'item-2',
            costs: BigInt(1000),
            acquired_at: new Date(),
            asset: {
              salvage_value: BigInt(0),
              life_months: null,
              decline_balance_rate: 10,
              depreciation_method: DepreciationMethod.DECLINNING_BALANCE,
            },
          },
        ])
        .mockResolvedValueOnce([]);

      await service.applyMonthlyDepreciation();

      const sql: string = prismaMock.$executeRawUnsafe.mock.calls[0][0];
      // newCost = 1000 - (1000 * 10 / 100) = 900
      expect(sql).toContain('900');
      expect(sql).toContain('item-2');
    });

    it('does not issue UPDATE when all items are skipped', async () => {
      prismaMock.assetItems.findMany
        .mockResolvedValueOnce([
          {
            id: 'item-3',
            costs: BigInt(100),
            acquired_at: new Date(),
            asset: {
              salvage_value: BigInt(100),
              life_months: 12,
              decline_balance_rate: null,
              depreciation_method: DepreciationMethod.STRAIGHT_LINE,
            },
          },
        ])
        .mockResolvedValueOnce([]);

      await service.applyMonthlyDepreciation();

      expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
    });

    it('processes multiple batches using cursor pagination', async () => {
      const makeItem = (id: string) => ({
        id,
        costs: BigInt(1200),
        acquired_at: new Date(),
        asset: {
          salvage_value: BigInt(0),
          life_months: 12,
          decline_balance_rate: null,
          depreciation_method: DepreciationMethod.STRAIGHT_LINE,
        },
      });

      prismaMock.assetItems.findMany
        .mockResolvedValueOnce([makeItem('item-a'), makeItem('item-b')])
        .mockResolvedValueOnce([makeItem('item-c')])
        .mockResolvedValueOnce([]);

      const result = await service.applyMonthlyDepreciation();

      expect(result).toBe(3);
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledTimes(2);
      // Second batch call should have used cursor (skip+cursor present in findMany)
      const secondFindManyCall = prismaMock.assetItems.findMany.mock.calls[1][0];
      expect(secondFindManyCall.cursor).toEqual({ id: 'item-b' });
      expect(secondFindManyCall.skip).toBe(1);
    });

    it('floors updated cost at salvage_value in batch SQL', async () => {
      prismaMock.assetItems.findMany
        .mockResolvedValueOnce([
          {
            id: 'item-4',
            costs: BigInt(1000),
            acquired_at: new Date(),
            asset: {
              salvage_value: BigInt(900),
              life_months: 1,
              decline_balance_rate: null,
              depreciation_method: DepreciationMethod.STRAIGHT_LINE,
            },
          },
        ])
        .mockResolvedValueOnce([]);

      await service.applyMonthlyDepreciation();

      const sql: string = prismaMock.$executeRawUnsafe.mock.calls[0][0];
      // (1000 - 900) / 1 = 100 → 1000 - 100 = 900 == salvage_value
      expect(sql).toContain('900');
    });
  });
});
