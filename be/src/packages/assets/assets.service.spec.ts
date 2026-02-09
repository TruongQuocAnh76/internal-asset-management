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
    },
    assetsKits: {
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
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

  it('should increment count if duplicate kit exists', async () => {
    jest.spyOn(service, 'checkDuplicateKit').mockResolvedValue('kit-1');

    prisma.assetsKits.update.mockResolvedValue({
      id: 'kit-1',
      count: 2,
    } as any);

    const result = await service.createAssetKit(
      { name: 'Kit A', asset_ids: ['a1', 'a2'] },
      'user-1',
    );

    expect(prisma.assetsKits.update).toHaveBeenCalledWith({
      where: { id: 'kit-1' },
      data: { count: { increment: 1 } },
    });

    expect(result.id).toBe('kit-1');
  });

  it('should create new kit with worst asset status', async () => {
    jest.spyOn(service, 'checkDuplicateKit').mockResolvedValue(null);

    prisma.assets.findMany.mockResolvedValue([
      { id: 'a1', status: AssetStatus.READY },
      { id: 'a2', status: AssetStatus.BROKEN },
    ] as any);

    prisma.assetsKits.create.mockResolvedValue({
      id: 'new-kit',
      status: AssetStatus.BROKEN,
    } as any);

    const result = await service.createAssetKit(
      { name: 'Kit B', asset_ids: ['a1', 'a2'] },
      'user-1',
    );

    expect(prisma.assets.findMany).toHaveBeenCalled();
    expect(prisma.assetsKits.create).toHaveBeenCalledWith({
      data: {
        name: 'Kit B',
        status: AssetStatus.BROKEN,
        assets_kits_items: {
          createMany: {
            data: [{ asset_id: 'a1' }, { asset_id: 'a2' }],
          },
        },
      },
    });

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
});
