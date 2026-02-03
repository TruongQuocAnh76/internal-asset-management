import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetAssetsParams } from './dto/get-assets-params.dto';
import { AssetStatus, Prisma } from '@prisma/client';
import { EditAssetDto, EditAssetDtoSchema } from './dto/edit-asset.dto';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async getAssets(query: GetAssetsParams) {
    const where = this.buildWhere(query);
    const take = query.limit || 20;
    const skip = query.page ? (query.page - 1) * take : 0;
    const orderBy = query.filter
      ? { [query.filter]: { name: query.order || 'asc' } }
      : undefined;

    const assets = await this.prisma.assets.findMany({
      where: where,
      orderBy: orderBy,
      skip: skip,
      take: take,
      select: {
        id: true,
        code: true,
        name: true,
        category: {
          select: {
            name: true,
          },
        },
        status: true,
        costs: true,
        acquired_at: true,
      },
    });

    const totalAssetsCount = await this.prisma.assets.count({ where: where });

    const res = assets.map((asset) => {
      return {
        ...asset,
        costs: Number(asset.costs),
      };
    });

    return {
      data: res,
      pagination: {
        page: skip / take + 1,
        limit: take,
        totalAssets: totalAssetsCount,
        totalPages: Math.ceil(totalAssetsCount / take),
        hasNext: skip < totalAssetsCount,
        hasPrev: skip > 0,
      },
    };
  }

  async getAssetById(id: string) {
    const asset = await this.prisma.assets.findUnique({
      where: { id: id },
      select: {
        id: true,
        code: true,
        name: true,
        category: {
          select: {
            name: true,
          },
        },
        asset_specs: {
          select: {
            specs: true,
          },
        },
        status: true,
        costs: true,
        acquired_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const { costs, ...rest } = asset;

    return { costs: Number(costs), ...rest };
  }

  async createAsset(body: CreateAssetDto) {
    const { id } = await this.checkCategory(body.category_name);

    const asset_code = body.name
      .toLocaleLowerCase()
      .replace(/\s+/g, '_')
      .concat('_', Date.now().toString().slice(-4));

    const { category_name, costs, specs, ...rest } = body;
    const asset_costs = Number(costs);

    return this.prisma.assets.create({
      data: {
        ...rest,
        code: asset_code,
        category_id: id,
        costs: asset_costs,
        asset_specs: {
          create: {
            specs: JSON.parse(JSON.stringify(body.specs)) || {},
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  async updateAsset(id: string, body: EditAssetDto) {
    const data = EditAssetDtoSchema.parse(body);
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    // create the category if not exists
    let category;
    if (data.category_name) {
      category = await this.checkCategory(data.category_name);
    }

    const { category_name, specs, costs, ...rest } = data;
    const asset = await this.prisma.assets.update({
      where: { id: id },
      data: {
        ...rest,
        ...(category?.id && { category_id: category.id }),
        asset_specs: {
          update: {
            specs: JSON.parse(JSON.stringify(data.specs)) || {},
          },
        },
        costs: Number(data.costs),
      },
    });

    const { costs: assetCosts, ...assetRest } = asset;
    return { costs: Number(assetCosts), ...assetRest };
  }

  protected async checkCategory(category_name: string) {
    const category_code = category_name
      .toLocaleLowerCase()
      .replace(/\s+/g, '_');
    return await this.prisma.assetsCategories.upsert({
      where: { code: category_code },
      update: {},
      create: { name: category_name, code: category_code },
    });
  }

  protected buildWhere(query: GetAssetsParams): Prisma.AssetsWhereInput {
    const where: Prisma.AssetsWhereInput = {};

    if (query.filter && query.filter_value) {
      if (query.filter === 'category') {
        where.category = {
          name: query.filter_value,
        };
      } else if (query.filter === 'status') {
        where.status = query.filter_value as AssetStatus;
      } else if (query.filter === 'costs') {
        where.costs = Number(query.filter_value);
      } else if (query.filter === 'acquired_at') {
        where.acquired_at = new Date(query.filter_value);
      }
    }

    if (query.search) {
      where.OR = [
        {
          name: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return where;
  }

  async getAsssetsCountByCategory(category: string) {
    if (category) {
      const count = await this.prisma.assets.count({
        where: {
          category: {
            name: category,
          },
        },
      });
      return { category, count };
    }

    const categories = await this.prisma.assetsCategories.findMany({
      select: {
        name: true,
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    return categories.map((cat) => ({
      category: cat.name,
      count: cat._count.assets,
    }));
  }

  async getSummary() {
    const [
      countAll,
      countAvailable,
      countInUse,
      countMaintenance,
      countBroken,
      countLiquidated,
    ] = await Promise.all([
      this.prisma.assets.count(),
      this.prisma.assets.count({ where: { status: 'READY' } }),
      this.prisma.assets.count({ where: { status: 'IN_USE' } }),
      this.prisma.assets.count({ where: { status: 'MAINTAINANCE' } }),
      this.prisma.assets.count({ where: { status: 'BROKEN' } }),
      this.prisma.assets.count({ where: { status: 'LIQUIDATED' } }),
    ]);
    return {
      countAll,
      byStatus: {
        countAvailable,
        countInUse,
        countMaintenance,
        countBroken,
        countLiquidated,
      },
    };
  }
}
