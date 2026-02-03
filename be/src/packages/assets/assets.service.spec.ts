import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus } from '@prisma/client';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: PrismaService;

  const prismaMock = {
    assets: {
      findMany: jest.fn(),
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

  it('calls prisma.findMany with correct params and casts costs', async () => {
    prismaMock.assets.findMany.mockResolvedValue([
      {
        code: 'A001',
        name: 'Laptop',
        status: 'READY',
        costs: '1500', // prisma Decimal/string
        acquired_at: new Date(),
        category: { name: 'Electronics' },
      },
    ]);

    const result = await service.getAssets({
      filter: 'status',
      filter_value: 'READY',
      order: 'asc',
      page: 2,
      limit: 10,
    });

    expect(prisma.assets.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: AssetStatus.READY },
        orderBy: { status: 'asc' },
        skip: 10,
        take: 10,
      }),
    );

    expect(result[0].costs).toBe(1500);
    expect(typeof result[0].costs).toBe('number');
  });
});
