import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async getAssetsByStatus(status_type: AssetStatus) {
    if (
      !['READY', 'IN_USE', 'MAINTAINANCE', 'BROKEN', 'LIQUIDATED'].includes(
        status_type,
      )
    ) {
      throw new BadRequestException('Invalid status type');
    }
    const assets = await this.prisma.assets.findMany({
      where: {
        status: status_type,
      },
      select: {
        name: true,
        code: true,
        category: true,
        status: true,
        costs: true,
      },
    });
    return assets.map((asset) => ({
      ...asset,
      costs: Number(asset.costs),
    }));
  }

  async getAsssetsByCategory(category: string) {
    const assets = await this.prisma.assets.findMany({
      where: {
        category: {
          name: category || undefined,
        },
      },
      select: {
        name: true,
        code: true,
        category: true,
        status: true,
        costs: true,
      },
    });
    return assets.map((asset) => ({
      ...asset,
      costs: Number(asset.costs),
    }));
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
