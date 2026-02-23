import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetAssetsParams } from './dto/get-assets-params.dto';
import { AssetStatus, Prisma } from '@prisma/client';
import { EditAssetDto, EditAssetDtoSchema } from './dto/edit-asset.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AuditService } from 'src/core/audit/audit.service';
import { Entity } from 'src/core/enums/entity.enum';
import { StorageService } from 'src/core/storage/storage.service';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private storageService: StorageService,
  ) {}

  async getAssets(query: GetAssetsParams) {
    const where = this.buildWhere(query);
    const take = query.limit || 20;
    const skip = query.page ? (query.page - 1) * take : 0;

    const orderBy = query.orderBy
      ? { [query.orderBy]: 'asc' as const }
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
        image_urls: true,
        acquired_at: true,
        _count: {
          select: {
            asset_items: true,
          },
        },
      },
    });

    const totalAssetsCount = await this.prisma.assets.count({ where: where });

    const res = assets.map((asset) => {
      const { _count, ...rest } = asset;
      return {
        ...rest,
        stock: _count.asset_items,
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
        image_urls: true,
        acquired_at: true,
        created_at: true,
        updated_at: true,
        asset_items: {
          select: {
            id: true,
            status: true,
            location_name: true,
            costs: true,
            acquired_at: true,
            kit_id: true,
            kit_status: true,
          },
        },
        _count: {
          select: {
            asset_items: true,
          },
        },
        borrow_requests: {
          where: {
            status: { in: ['APPROVED', 'PROVIDED'] },
          },
          select: { requester_id: true },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const { _count, borrow_requests, ...rest } = asset;

    return {
      stock: _count.asset_items,
      borrower_id: borrow_requests[0]?.requester_id ?? null,
      ...rest,
      asset_items: asset.asset_items.map((item) => ({
        ...item,
        costs: item.costs ? Number(item.costs) : null,
      })),
    };
  }

  async getAssetItems(assetId: string) {
    const asset = await this.prisma.assets.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const items = await this.prisma.assetItems.findMany({
      where: { asset_id: assetId },
      select: {
        id: true,
        status: true,
        location_name: true,
        costs: true,
        acquired_at: true,
        kit_id: true,
        kit_status: true,
        created_at: true,
        updated_at: true,
        kit: {
          select: {
            id: true,
            template: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return items.map((item) => ({
      ...item,
      costs: item.costs ? Number(item.costs) : null,
    }));
  }

  async createAsset(body: CreateAssetDto, userId: string) {
    const category = await this.checkCategory(body.category_name);
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const asset_code = body.name
      .toLocaleLowerCase()
      .replace(/\s+/g, '_')
      .concat('_', Date.now().toString().slice(-4));

    const { category_name, costs, specs, image_num, initial_quantity, location_name, ...rest } = body;
    const asset_costs = costs !== undefined ? Number(costs) : null;

    // create temp url for each images
    const fileNames: string[] = [];
    const tempImageUrls: string[] = [];

    for (let i = 0; i < body.image_num; i++) {
      const fileName = `${asset_code}_image_${i}_${Date.now()}`;
      fileNames.push(fileName);
      const presignedUrl =
        await this.storageService.getPresignedUploadUrl(fileName);
      tempImageUrls.push(presignedUrl);
    }

    // const imageUrls = fileNames.map((fileName) =>
    //   this.storageService.getUrl(fileName),
    // );

    const createdAsset = await this.prisma.assets.create({
      data: {
        ...rest,
        code: asset_code,
        category_id: category.id,
        asset_specs: {
          create: {
            specs: JSON.parse(JSON.stringify(body.specs)) || {},
          },
        },
        image_urls: fileNames,
        // Create individual asset items based on initial_quantity
        asset_items: {
          createMany: {
            data: Array.from({ length: initial_quantity || 1 }, () => ({
              location_name: body.location_name,
              costs: asset_costs,
            })),
          },
        },
      },
      select: {
        id: true,
      },
    });

    // add audit record
    await this.auditService.addRecord(
      userId,
      'CREATE',
      Entity.ASSET,
      createdAsset.id,
      {},
      JSON.stringify(body),
    );

    // Recompute cached asset status
    await this.recomputeAssetStatus(createdAsset.id);

    return { createdAsset, tempImageUrls };
  }

  async updateAsset(id: string, body: EditAssetDto, userId: string) {
    const data = EditAssetDtoSchema.parse(body);
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    // Fetch the current asset state before update
    const beforeAsset = await this.prisma.assets.findUnique({
      where: { id: id },
    });

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
            specs: JSON.parse(JSON.stringify(data.specs ?? {})),
          },
        },
      },
    });

    // Add audit record
    await this.auditService.addRecord(
      userId,
      'UPDATE',
      Entity.ASSET,
      id,
      JSON.stringify(beforeAsset),
      JSON.stringify(data),
    );

    return asset;
  }

  protected async checkCategory(category_name: string) {
    return await this.prisma.assetsCategories.findFirst({
      where: { name: category_name },
    });
  }

  protected buildWhere(query: GetAssetsParams): Prisma.AssetsWhereInput {
    const where: Prisma.AssetsWhereInput = {};

    if (query.filter && query.filterValue) {
      if (query.filter === 'category') {
        where.category = {
          name: query.filterValue,
        };
      } else if (query.filter === 'status') {
        query.filterValue = query.filterValue.toUpperCase();
        if (
          !Object.values(AssetStatus).includes(query.filterValue as AssetStatus)
        ) {
          throw new BadRequestException('Invalid asset status');
        }
        where.status = query.filterValue as AssetStatus;
      } else if (query.filter === 'acquired_at') {
        where.acquired_at = new Date(query.filterValue);
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
      countAllAssets,
      countAllItems,
      countItemsReady,
      countItemsInUse,
      countItemsMaintenance,
      countItemsBroken,
      countItemsLiquidated,
    ] = await Promise.all([
      this.prisma.assets.count(),
      this.prisma.assetItems.count(),
      this.prisma.assetItems.count({ where: { status: 'READY' } }),
      this.prisma.assetItems.count({ where: { status: 'IN_USE' } }),
      this.prisma.assetItems.count({ where: { status: 'MAINTAINANCE' } }),
      this.prisma.assetItems.count({ where: { status: 'BROKEN' } }),
      this.prisma.assetItems.count({ where: { status: 'LIQUIDATED' } }),
    ]);
    return {
      countAllAssets,
      countAllItems,
      byItemStatus: {
        countItemsReady,
        countItemsInUse,
        countItemsMaintenance,
        countItemsBroken,
        countItemsLiquidated,
      },
    };
  }

  protected async adjustAssetStock(assetId: string, value: number) {
    const asset = await this.prisma.assets.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    if (value > 0) {
      // Add new asset items
      const newItems = await this.prisma.assetItems.createManyAndReturn({
        data: Array.from({ length: value }, () => ({
          asset_id: assetId,
        })),
      });

      await this.auditService.addRecord(
        'system',
        'UPDATE',
        Entity.ASSET,
        assetId,
        JSON.stringify({ action: 'add_items', count: value }),
        JSON.stringify(newItems),
      );

      // Recompute cached asset status
      await this.recomputeAssetStatus(assetId);

      return newItems;
    } else if (value < 0) {
      // Remove READY asset items (only unallocated, not in a kit)
      const itemsToRemove = await this.prisma.assetItems.findMany({
        where: {
          asset_id: assetId,
          status: 'READY',
          kit_id: null,
        },
        take: Math.abs(value),
        orderBy: { created_at: 'asc' },
      });

      if (itemsToRemove.length < Math.abs(value)) {
        throw new BadRequestException(
          `Cannot remove ${Math.abs(value)} items. Only ${itemsToRemove.length} available READY items found.`,
        );
      }

      const removedIds = itemsToRemove.map((item) => item.id);

      await this.prisma.assetItems.deleteMany({
        where: { id: { in: removedIds } },
      });

      await this.auditService.addRecord(
        'system',
        'DELETE',
        Entity.ASSET,
        assetId,
        JSON.stringify({ action: 'remove_items', ids: removedIds }),
        JSON.stringify({}),
      );

      // Recompute cached asset status
      await this.recomputeAssetStatus(assetId);

      return { removed: removedIds.length };
    }

    return { message: 'No stock adjustment needed' };
  }

  /**
   * Recompute cached status on the Assets row.
   * READY if at least 1 asset_item is READY, otherwise IN_USE.
   */
  async recomputeAssetStatus(assetId: string): Promise<AssetStatus> {
    const readyCount = await this.prisma.assetItems.count({
      where: { asset_id: assetId, status: AssetStatus.READY },
    });
    const newStatus = readyCount > 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await this.prisma.assets.update({
      where: { id: assetId },
      data: { status: newStatus },
    });
    return newStatus;
  }
}
