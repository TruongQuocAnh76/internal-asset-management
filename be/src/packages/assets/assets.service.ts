import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetAssetsParams } from './dto/get-assets-params.dto';
import { AssetStatus, Prisma } from '@prisma/client';
import { EditAssetDto, EditAssetDtoSchema } from './dto/edit-asset.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AuditService } from 'src/core/audit/audit.service';
import { Entity } from 'src/core/enums/entity.enum';
import { StorageService } from 'src/core/storage/storage.service';
import { CreateKitDto, UpdateKitDto } from './dto/create-kit.dto';
import { GetKitsParams } from './dto/get-kits-params.dto';

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
        costs: true,
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
        costs: Number(asset.costs),
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
        costs: true,
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
      },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const { costs, _count, ...rest } = asset;

    return {
      costs: Number(costs),
      stock: _count.asset_items,
      ...rest,
      asset_items: asset.asset_items.map((item) => ({
        ...item,
        costs: item.costs ? Number(item.costs) : null,
      })),
    };
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

    const { category_name, costs, specs, image_num, initial_quantity, ...rest } = body;
    const asset_costs = Number(costs);

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
        costs: asset_costs,
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
        ...(data.costs !== undefined && { costs: Number(data.costs) }),
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

    const { costs: assetCosts, ...assetRest } = asset;
    return { costs: Number(assetCosts), ...assetRest };
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
      } else if (query.filter === 'costs') {
        where.costs = Number(query.filterValue);
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

  async createAssetKit(body: CreateKitDto, userId: string) {
    // check for duplicate kit
    const duplicateKitId = await this.checkDuplicateKit(body.asset_ids);
    // if duplicate kit found, up the count for that kit, otherwise create new kit
    if (duplicateKitId) {
      const initialKit = await this.prisma.assetsKits.findUnique({
        where: { id: duplicateKitId },
        include: {
          assets_kits_items: {
            include: {
              asset: true,
            },
          },
        },
      });
      const assetKits = await this.prisma.assetsKits.update({
        where: { id: duplicateKitId },
        data: {
          stock: {
            increment: 1,
          },
        },
        include: {
          assets_kits_items: {
            include: {
              asset: true,
            },
          },
        },
      });
      await this.auditService.addRecord(
        userId,
        'UPDATE',
        Entity.ASSET_KIT,
        duplicateKitId,
        JSON.stringify(initialKit),
        JSON.stringify({ action: 'increment count' }),
      );
      return {
        ...assetKits,
        assets_kits_items: assetKits.assets_kits_items.map((item) => ({
          ...item,
          asset: {
            ...item.asset,
            costs: Number(item.asset.costs),
          },
        })),
      };
    }

    // check asset item status
    const assets_status = await this.prisma.assets.findMany({
      where: {
        id: {
          in: body.asset_ids,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    // kit asset will take the status of the worst condition asset, e.g. if one asset is broken, the whole kit is considered broken and cannot be allocated
    const statusPriority = {
      READY: 1,
      IN_USE: 2,
      MAINTAINANCE: 3,
      BROKEN: 4,
      LIQUIDATED: 5,
    };

    const kitStatus = assets_status.reduce((worstStatus, asset) => {
      return statusPriority[asset.status] > statusPriority[worstStatus]
        ? asset.status
        : worstStatus;
    }, 'READY' as AssetStatus);

    // create new kit
    const newKit = await this.prisma.assetsKits.create({
      data: {
        name: body.name,
        status: kitStatus,
        assets_kits_items: {
          createMany: {
            data: body.asset_ids.map((asset_id) => ({
              asset_id,
            })),
          },
        },
      },
      include: {
        assets_kits_items: {
          include: {
            asset: true,
          },
        },
      },
    });

    // add audit record
    await this.auditService.addRecord(
      userId,
      'CREATE',
      Entity.ASSET_KIT,
      newKit.id,
      {},
      JSON.stringify(body),
    );

    return {
      ...newKit,
      assets_kits_items: newKit.assets_kits_items.map((item) => ({
        ...item,
        asset: {
          ...item.asset,
          costs: Number(item.asset.costs),
        },
      })),
    };
  }

  async checkDuplicateKit(asset_ids: string[]) {
    const availableKits = await this.prisma.assetsKits.findMany({
      where: {
        asset_allocations: {
          none: {},
        },
      },
      include: {
        assets_kits_items: {
          select: {
            asset_id: true,
          },
        },
      },
    });

    // compare asset_ids with each kit's asset_ids
    for (const kit of availableKits) {
      const kitAssetIds = kit.assets_kits_items.map((item) => item.asset_id);
      if (
        kitAssetIds.length === asset_ids.length &&
        kitAssetIds.every((id) => asset_ids.includes(id))
      ) {
        return kit.id;
      }
    }
    return null;
  }

  async getAssetKitById(id: string) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id },
      include: {
        assets_kits_items: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    return {
      ...kit,
      assets_kits_items: kit.assets_kits_items.map((item) => ({
        ...item,
        asset: {
          ...item.asset,
          costs: Number(item.asset.costs),
        },
      })),
    };
  }

  async deleteAssetKitById(id: string, userId: string) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    // delete the kit
    await this.prisma.assetsKits.delete({
      where: { id },
    });

    // add audit record
    await this.auditService.addRecord(
      userId,
      'DELETE',
      Entity.ASSET_KIT,
      id,
      JSON.stringify(kit),
      {},
    );

    return { message: 'Asset kit deleted successfully' };
  }

  async getAllAssetKits(query: GetKitsParams) {
    const where = this.buildWhereKit(query);
    const take = query.limit || 20;
    const skip = query.page ? (query.page - 1) * take : 0;

    const orderBy = query.orderBy
      ? { [query.orderBy]: query.order || 'asc' }
      : undefined;

    const kits = await this.prisma.assetsKits.findMany({
      where: where,
      orderBy: orderBy,
      skip: skip,
      take: take,
      include: {
        assets_kits_items: {
          include: {
            asset: true,
          },
        },
      },
    });

    const totalKitsCount = await this.prisma.assetsKits.count({ where: where });

    const res = kits.map((kit) => ({
      ...kit,
      assets_kits_items: kit.assets_kits_items.map((item) => ({
        ...item,
        asset: {
          ...item.asset,
          costs: Number(item.asset.costs),
        },
      })),
    }));

    return {
      data: res,
      pagination: {
        page: skip / take + 1,
        limit: take,
        totalKits: totalKitsCount,
        totalPages: Math.ceil(totalKitsCount / take),
        hasNext: skip + take < totalKitsCount,
        hasPrev: skip > 0,
      },
    };
  }

  protected buildWhereKit(query: GetKitsParams) {
    const where: Prisma.AssetsKitsWhereInput = {};
    if (query.filter && query.filterValue) {
      if (query.filter === 'status') {
        where.status = query.filterValue as AssetStatus;
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
      ];
    }
    return where;
  }

  async updateAssetKitById(id: string, body: UpdateKitDto, userId: string) {
    const initialKit = await this.prisma.assetsKits.findUnique({
      where: { id },
      include: {
        assets_kits_items: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!initialKit) {
      throw new BadRequestException('Asset kit not found');
    }

    const updatedKit = await this.prisma.assetsKits.update({
      where: { id },
      data: {
        name: body.name,
      },
      include: {
        assets_kits_items: {
          include: {
            asset: true,
          },
        },
      },
    });

    // add audit record
    await this.auditService.addRecord(
      userId,
      'UPDATE',
      Entity.ASSET_KIT,
      id,
      JSON.stringify(initialKit),
      JSON.stringify(body),
    );

    return {
      ...updatedKit,
      assets_kits_items: updatedKit.assets_kits_items.map((item) => ({
        ...item,
        asset: {
          ...item.asset,
          costs: Number(item.asset.costs),
        },
      })),
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
          location_name: asset.location_name,
          costs: asset.costs,
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

      return { removed: removedIds.length };
    }

    return { message: 'No stock adjustment needed' };
  }

  protected async adjustKitStock(kitId: string, value: number) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    const newKit = await this.prisma.assetsKits.update({
      where: { id: kitId },
      data: {
        stock: { increment: value },
      },
    });

    await this.auditService.addRecord(
      'system',
      'UPDATE',
      Entity.ASSET_KIT,
      kitId,
      JSON.stringify(kit),
      JSON.stringify(newKit),
    );

    return newKit;
  }
}
