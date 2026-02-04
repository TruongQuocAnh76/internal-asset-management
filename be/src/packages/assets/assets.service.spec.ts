import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus } from '@prisma/client';
import { EditAssetDto } from './dto/edit-asset.dto';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: PrismaService;

  const prismaMock = {
    assets: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
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
      filter_value: 'Laptop',
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
      filter_value: 'READY',
    });

    expect(where).toEqual({
      status: AssetStatus.READY,
    });
  });

  it('builds where clause for costs filter', () => {
    const where = (service as any).buildWhere({
      filter: 'costs',
      filter_value: '1500',
    });

    expect(where).toEqual({
      costs: 1500,
    });
  });

  it('builds where clause for acquired_at filter', () => {
    const date = '2024-01-01';

    const where = (service as any).buildWhere({
      filter: 'acquired_at',
      filter_value: date,
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
      filter_value: 'READY',
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
    });

    const result = await service.updateAsset(id, body);

    expect(prisma.assets.update).toHaveBeenCalledWith({
      where: { id },
      data: { category_name: 'New name' },
    });

    expect(result).toEqual({
      id,
      category_name: 'New name',
    });
  });

  it('should update asset with multiple fields', async () => {
    const id = 'asset-id';
    const body: EditAssetDto = {
      category_name: 'Laptop',
      costs: 1200,
    };

    prisma.assets.update.mockResolvedValue({
      id,
      category_name: 'Laptop',
      costs: 1200,
    });

    const result = await service.updateAsset(id, body);

    expect(prisma.assets.update).toHaveBeenCalledWith({
      where: { id },
      data: {
        category_name: 'Laptop',
        costs: 1200,
      },
    });

    expect(result.costs).toBe(1200);
  });
});
