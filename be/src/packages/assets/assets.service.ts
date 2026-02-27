import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetAssetsParams } from './dto/get-assets-params.dto';
import { AssetStatus, Prisma } from '@prisma/client';
import { EditAssetDto, EditAssetDtoSchema } from './dto/edit-asset.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { StorageService } from 'src/core/storage/storage.service';
import { DepreciationMethod } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { SetMaintenanceDto } from './dto/maintenance.dto';
import { ResolveMaintenanceDto } from './dto/maintenance.dto';
import { KitsService } from '../kits/kits.service';
@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private mailService: MailService,
    private kitsService: KitsService,
  ) { }

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

    // Verify asset exists when no items are found
    if (items.length === 0) {
      const asset = await this.prisma.assets.findUnique({
        where: { id: assetId },
        select: { id: true },
      });
      if (!asset) {
        throw new NotFoundException('Asset not found');
      }
    }

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

    const { category_name, costs, specs, image_num, initial_quantity, location_name, salvage_value, life_months, decline_balance_rate, depreciation_method, ...rest } = body;
    const asset_costs = costs !== undefined ? Number(costs) : null;

    // Fall back to category defaults when depreciation fields are not provided
    const resolvedMethod = depreciation_method ?? category.default_depreciation_method ?? null;
    const resolvedSalvageValue = salvage_value != null
      ? BigInt(salvage_value)
      : (category.salvage_value ?? null);
    const resolvedLifeMonths = life_months ?? category.default_life_months ?? null;
    const resolvedDeclineRate = decline_balance_rate ?? category.decline_balance_rate ?? null;

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
        salvage_value: resolvedSalvageValue,
        life_months: resolvedLifeMonths,
        decline_balance_rate: resolvedDeclineRate,
        depreciation_method: resolvedMethod,
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
              costs: asset_costs ?? BigInt(0),
            })),
          },
        },
      },
      select: {
        id: true,
      },
    });

    // Recompute cached asset status
    await this.recomputeAssetStatus(createdAsset.id, null, AssetStatus.READY);

    return { createdAsset, tempImageUrls };
  }

  async updateAsset(id: string, body: EditAssetDto, userId: string) {
    const data = EditAssetDtoSchema.parse(body);
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    // create the category if not exists
    let category;
    if (data.category_name) {
      category = await this.checkCategory(data.category_name);
    }

    const { category_name, specs, costs, salvage_value, life_months, decline_balance_rate, depreciation_method, ...rest } = data;
    const asset = await this.prisma.assets.update({
      where: { id: id },
      data: {
        ...rest,
        ...(category?.id && { category_id: category.id }),
        ...(salvage_value !== undefined && { salvage_value: salvage_value != null ? BigInt(salvage_value) : null }),
        ...(life_months !== undefined && { life_months: life_months ?? null }),
        ...(decline_balance_rate !== undefined && { decline_balance_rate: decline_balance_rate ?? null }),
        ...(depreciation_method !== undefined && { depreciation_method: depreciation_method ?? null }),
        asset_specs: {
          update: {
            specs: JSON.parse(JSON.stringify(data.specs ?? {})),
          },
        },
      },
    });

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

  /**
   * Recompute cached status on the Assets row.
   */
  private async recomputeAssetStatus(
    assetId: string,
    currentStatus: AssetStatus | null,
    updateStatus: AssetStatus,
    tx?: any,
  ): Promise<AssetStatus> {
    const client = tx || this.prisma;

    try {
      if (updateStatus == AssetStatus.READY) {
        await client.assets.update({
          where: { id: assetId },
          data: { status: AssetStatus.READY },
        });
        return AssetStatus.READY;
      }

      let currStatus = currentStatus;
      if (!currStatus) {
        const current = await client.assets.findUnique({
          where: { id: assetId },
          select: { status: true },
        });
        if (!current) return AssetStatus.READY;
        currStatus = current.status as AssetStatus;
      }

      if (currStatus !== AssetStatus.READY) {
        const [cnt, totalCount] = await Promise.all([
          client.assetItems.count({
            where: { asset_id: assetId, status: updateStatus },
          }),
          client.assetItems.count({
            where: { asset_id: assetId },
          }),
        ]);

        if (cnt === totalCount && updateStatus !== null) {
          await client.assets.update({
            where: { id: assetId },
            data: { status: updateStatus },
          });
          return updateStatus;
        }
        return currStatus;
      } else {
        const readyCount = await client.assetItems.count({
          where: { asset_id: assetId, status: AssetStatus.READY },
        });
        // since current is ready, there's atleast 1 ready item
        // if readyCount < 1, then asset status is update status
        if (readyCount < 1) {
          await client.assets.update({
            where: { id: assetId },
            data: { status: updateStatus},
          });
          return updateStatus;
        }
        // otherwise its still ready
        return AssetStatus.READY;
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Asset not found');
      }
      throw error;
    }
  }

  computeDepreciation(params: {
    costs: bigint;
    salvage_value?: bigint | null;
    life_months?: number | null;
    decline_balance_rate?: number | null;
    depreciation_method: DepreciationMethod;
  }): bigint {
    const { costs, depreciation_method } = params;
    const salvageValue = params.salvage_value ?? BigInt(0);

    // Already fully depreciated
    if (costs <= salvageValue) return salvageValue;

    let monthlyDepreciation = BigInt(0);

    if (depreciation_method === DepreciationMethod.STRAIGHT_LINE) {
      if (params.life_months && params.life_months > 0) {
        monthlyDepreciation = (costs - salvageValue) / BigInt(params.life_months);
      }
    } else if (depreciation_method === DepreciationMethod.DECLINING_BALANCE) {
      if (params.decline_balance_rate && params.decline_balance_rate > 0) {
        monthlyDepreciation = (costs * BigInt(params.decline_balance_rate)) / BigInt(100);
      }
    }

    if (monthlyDepreciation <= BigInt(0)) return costs;

    const newCost = costs - monthlyDepreciation;
    return newCost < salvageValue ? salvageValue : newCost;
  }

  /**
   * Apply monthly depreciation to all asset items whose parent asset
   * has a depreciation_method configured. Processes in batches using
   * cursor-based pagination.
   */
  async applyMonthlyDepreciation(): Promise<number> {
    const batchSize = 500;
    let processed = 0;
    let cursor: string | undefined;
    while (true) {
      const items = await this.prisma.assetItems.findMany({
        where: {
          asset: {
            depreciation_method: { not: null },
            status: { not: 'LIQUIDATED' },
          },
        },
        select: {
          id: true,
          costs: true,
          asset: {
            select: {
              salvage_value: true,
              life_months: true,
              decline_balance_rate: true,
              depreciation_method: true,
            },
          },
          acquired_at: true,
        },
        take: batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      });

      if (items.length === 0) break;


      const updates: { id: string; newCost: bigint }[] = [];
      for (const item of items) {
        const currentCost = item.costs;
        const salvageValue = item.asset.salvage_value ?? BigInt(0);

        if (currentCost <= salvageValue) continue;

        const newCost = this.computeDepreciation({
          costs: currentCost,
          salvage_value: item.asset.salvage_value,
          life_months: item.asset.life_months,
          decline_balance_rate: item.asset.decline_balance_rate,
          depreciation_method: item.asset.depreciation_method!,
        });

        if (newCost >= currentCost) continue;

        updates.push({ id: item.id, newCost });
      }

      if (updates.length > 0) {
        const values = updates
          .map((u) => `('${u.id}'::uuid, ${u.newCost}::bigint)`)
          .join(', ');

        await this.prisma.$executeRawUnsafe(`
          UPDATE "AssetItems" ai
          SET costs = v.new_cost
          FROM (VALUES ${values}) AS v(id, new_cost)
          WHERE ai.id = v.id::uuid
        `);
      }
      processed += items.length;
      cursor = items[items.length - 1].id;
    }
    return processed;
  }

  // ── Maintenance workflow ────────────────────────────────────────

  /**
   * Set an asset item to MAINTAINANCE status.
   * Any authenticated user or admin can call this.
   * Sends email notification to all admins.
   */
  async setMaintenance(body: SetMaintenanceDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.assetItems.findUnique({
        where: { id: body.asset_item_id },
        include: {
          asset: { select: { id: true, name: true } },
          kit: { select: { id: true } },
        },
      });

      if (!item) {
        throw new NotFoundException('Asset item not found');
      }

      if (item.status === AssetStatus.MAINTAINANCE) {
        throw new BadRequestException('Asset item is already in maintenance');
      }

      if (item.status === AssetStatus.LIQUIDATED) {
        throw new BadRequestException('Cannot send a liquidated asset to maintenance');
      }

      // Update asset item status
      await tx.assetItems.update({
        where: { id: body.asset_item_id },
        data: {
          status: AssetStatus.MAINTAINANCE,
          maintenance_notes: body.maintenance_notes,
          last_maintained_at: new Date(),
        },
      });

      // Recompute parent asset status
      await this.recomputeAssetStatus(item.asset_id, null, AssetStatus.MAINTAINANCE, tx);

      // Recompute kit status if item belongs to a kit
      if (item.kit_id) {
        await this.kitsService.recomputeKitStatus(item.kit_id, null, AssetStatus.MAINTAINANCE, tx);
      }

      return { asset_item_id: body.asset_item_id, status: 'MAINTAINANCE' };
    }).then(async (result) => {
      // Send email notifications to admins (outside transaction)
      const item = await this.prisma.assetItems.findUnique({
        where: { id: body.asset_item_id },
        include: {
          asset: { select: { name: true } },
        },
      });
      const reporter = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { first_name: true, last_name: true },
      });
      const admins = await this.prisma.users.findMany({
        where: { user_roles: { some: { role: { name: 'Admin' } } } },
        select: { first_name: true, last_name: true, email: true },
      });

      const reporterName = reporter
        ? `${reporter.first_name} ${reporter.last_name}`
        : 'Unknown';

      for (const admin of admins) {
        if (!admin.email) continue;
        await this.mailService.sendMaintenanceNotification({
          recipientName: `${admin.first_name} ${admin.last_name}`,
          recipientEmail: admin.email,
          assetName: item?.asset.name ?? 'Unknown Asset',
          assetItemId: body.asset_item_id,
          maintenanceNotes: body.maintenance_notes,
          reportedBy: reporterName,
        });
      }

      return result;
    });
  }

  /**
   * Resolve maintenance for an asset item (admin only).
   * Can set status to READY (with repair record), BROKEN, or LIQUIDATED.
   */
  async resolveMaintenance(body: ResolveMaintenanceDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.assetItems.findUnique({
        where: { id: body.asset_item_id },
        include: {
          asset: { select: { id: true, name: true } },
          kit: { select: { id: true } },
        },
      });

      if (!item) {
        throw new NotFoundException('Asset item not found');
      }

      if (item.status !== AssetStatus.MAINTAINANCE) {
        throw new BadRequestException(
          'Asset item is not in maintenance status',
        );
      }

      const newStatus = body.resolved_status as AssetStatus;

      // Create a repair record
      await tx.assetRepairs.create({
        data: {
          asset_item_id: body.asset_item_id,
          cost: BigInt(body.repair_cost ?? 0),
          description: body.description ?? null,
          resolved_status: newStatus,
        },
      });

      // Update asset item status
      await tx.assetItems.update({
        where: { id: body.asset_item_id },
        data: {
          status: newStatus,
          maintenance_notes: null,
          last_maintained_at: new Date(),
        },
      });

      // Recompute parent asset status
      await this.recomputeAssetStatus(item.asset_id, null, newStatus, tx);

      // Recompute kit status if item belongs to a kit
      if (item.kit_id) {
        await this.kitsService.recomputeKitStatus(item.kit_id, null, newStatus, tx);
      }

      return {
        asset_item_id: body.asset_item_id,
        status: newStatus,
      };
    });
  }

  /**
   * Get all asset items currently in maintenance.
   */
  async getMaintenanceItems() {
    const items = await this.prisma.assetItems.findMany({
      where: { status: AssetStatus.MAINTAINANCE },
      include: {
        asset: { select: { id: true, code: true, name: true } },
        kit: {
          select: {
            id: true,
            template: { select: { name: true } },
          },
        },
        repairs: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
      orderBy: { last_maintained_at: 'desc' },
    });

    return items.map((item) => ({
      ...item,
      costs: item.costs ? Number(item.costs) : null,
      repairs: item.repairs.map((r) => ({
        ...r,
        cost: Number(r.cost),
      })),
    }));
  }

  /**
   * Get repair history for a specific asset item.
   */
  async getRepairHistory(assetItemId: string) {
    const repairs = await this.prisma.assetRepairs.findMany({
      where: { asset_item_id: assetItemId },
      orderBy: { created_at: 'desc' },
    });

    return repairs.map((r) => ({
      ...r,
      cost: Number(r.cost),
    }));
  }
}
