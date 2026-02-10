import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus } from '@prisma/client';
import { EditAssetDto } from './dto/edit-asset.dto';
import { AuditService } from 'src/core/audit/audit.service';
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
  };

  const auditServiceMock = {
    logAction: jest.fn(),
    addRecord: jest.fn(),
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
          provide: AuditService,
          useValue: auditServiceMock,
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

  it('builds where clause for costs filter', () => {
    const where = (service as any).buildWhere({
      filter: 'costs',
      filterValue: '1500',
    });

    expect(where).toEqual({
      costs: 1500,
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

    auditServiceMock.addRecord = jest.fn().mockResolvedValue(undefined);

    const result = await service.updateAsset(id, body, userId);

    expect(prismaMock.assets.update).toHaveBeenCalledWith({
      where: { id },
      data: expect.objectContaining({
        category_id: 'cat-2',
        costs: 1200,
      }),
    });

    expect(result.costs).toBe(1200);
  });

  it('should increment stock if duplicate kit exists', async () => {
    jest.spyOn(service, 'checkDuplicateKit').mockResolvedValue('kit-1');

    prismaMock.assetsKits.findUnique.mockResolvedValue({
      id: 'kit-1',
      stock: 1,
      assets_kits_items: [],
    } as any);

    prismaMock.assetsKits.update.mockResolvedValue({
      id: 'kit-1',
      stock: 2,
      assets_kits_items: [],
    } as any);

    const result = await service.createAssetKit(
      { name: 'Kit A', asset_ids: ['a1', 'a2'] },
      'user-1',
    );

    expect(prismaMock.assetsKits.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'kit-1' },
        data: { stock: { increment: 1 } },
      }),
    );

    expect(result.id).toBe('kit-1');
  });

  it('should create new kit with worst asset status', async () => {
    jest.spyOn(service, 'checkDuplicateKit').mockResolvedValue(null);

    prismaMock.assets.findMany.mockResolvedValue([
      { id: 'a1', status: AssetStatus.READY },
      { id: 'a2', status: AssetStatus.BROKEN },
    ] as any);

    prismaMock.assetsKits.create.mockResolvedValue({
      id: 'new-kit',
      status: AssetStatus.BROKEN,
      assets_kits_items: [
        { asset: { id: 'a1', costs: BigInt(1000) } },
        { asset: { id: 'a2', costs: BigInt(2000) } },
      ],
    } as any);

    const result = await service.createAssetKit(
      { name: 'Kit B', asset_ids: ['a1', 'a2'] },
      'user-1',
    );

    expect(prismaMock.assets.findMany).toHaveBeenCalled();
    expect(prismaMock.assetsKits.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Kit B',
          status: AssetStatus.BROKEN,
          assets_kits_items: {
            createMany: {
              data: [{ asset_id: 'a1' }, { asset_id: 'a2' }],
            },
          },
        },
      }),
    );

    expect(result.status).toBe(AssetStatus.BROKEN);
  });

  it('should return kit id if asset set matches exactly', async () => {
    prisma.assetsKits.findMany.mockResolvedValue([
      {
        id: 'kit-123',
        assets_kits_items: [{ asset_id: 'a1' }, { asset_id: 'a2' }],
      },
    ] as any);

    const result = await service.checkDuplicateKit(['a2', 'a1']);

    expect(result).toBe('kit-123');
  });

  it('should return null if no match', async () => {
    prisma.assetsKits.findMany.mockResolvedValue([
      {
        id: 'kit-123',
        assets_kits_items: [{ asset_id: 'a1' }],
      },
    ] as any);

    const result = await service.checkDuplicateKit(['a1', 'a2']);

    expect(result).toBeNull();
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
    expect(result.data[0].costs).toBe(1500);
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
    } as any);

    const result = await service.getAssetById('a1');

    expect(result.stock).toBe(2);
    expect(result.costs).toBe(2000);
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
    prismaMock.assets.findUnique.mockResolvedValue({
      id: 'a1',
      location_name: 'Room A',
      costs: BigInt(1000),
    } as any);

    prismaMock.assetItems.createManyAndReturn.mockResolvedValue([
      { id: 'item-1', asset_id: 'a1' },
      { id: 'item-2', asset_id: 'a1' },
    ] as any);

    const result = await (service as any).adjustAssetStock('a1', 2);

    expect(prismaMock.assetItems.createManyAndReturn).toHaveBeenCalledWith({
      data: [
        { asset_id: 'a1', location_name: 'Room A', costs: BigInt(1000) },
        { asset_id: 'a1', location_name: 'Room A', costs: BigInt(1000) },
      ],
    });
    expect(result).toHaveLength(2);
  });

  it('should remove READY asset items when adjusting stock with negative value', async () => {
    prismaMock.assets.findUnique.mockResolvedValue({
      id: 'a1',
      location_name: 'Room A',
      costs: BigInt(1000),
    } as any);

    prismaMock.assetItems.findMany.mockResolvedValue([
      { id: 'item-1' },
      { id: 'item-2' },
    ] as any);

    prismaMock.assetItems.deleteMany.mockResolvedValue({ count: 2 });

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
    prismaMock.assets.findUnique.mockResolvedValue({
      id: 'a1',
      location_name: 'Room A',
      costs: BigInt(1000),
    } as any);

    prismaMock.assetItems.findMany.mockResolvedValue([{ id: 'item-1' }] as any);

    await expect((service as any).adjustAssetStock('a1', -3)).rejects.toThrow(
      'Cannot remove 3 items. Only 1 available READY items found.',
    );
  });

  it('should return no adjustment message when value is 0', async () => {
    prismaMock.assets.findUnique.mockResolvedValue({
      id: 'a1',
    } as any);

    const result = await (service as any).adjustAssetStock('a1', 0);

    expect(result).toEqual({ message: 'No stock adjustment needed' });
  });

  it('should throw if asset not found in adjustAssetStock', async () => {
    prismaMock.assets.findUnique.mockResolvedValue(null);

    await expect(
      (service as any).adjustAssetStock('non-existent', 1),
    ).rejects.toThrow('Asset not found');
  });
});
