import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetAssetsParams } from './dto/get-assets-params.dto';
import { AssetStatus, Prisma } from '@prisma/client';
import { EditAssetDto, EditAssetDtoSchema } from './dto/edit-asset.dto';
import { EditAssetItemDto, EditAssetItemDtoSchema } from './dto/edit-asset-item.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { StorageService } from 'src/core/storage/storage.service';
import { DepreciationMethod } from '@prisma/client';
import { MailService } from 'src/core/mail/mail.service';
import { SetMaintenanceDto } from './dto/maintenance.dto';
import { ResolveMaintenanceDto } from './dto/maintenance.dto';
import { KitsService } from '../kits/kits.service';
import PDFDocument = require('pdfkit');
import * as XLSX from 'xlsx';
import type {
  SummaryData,
  InventoryRow,
  FinancialRow,
  AllocationRow,
  RepairRow,
  KitRow,
  AuditRow,
} from './dto/report.type';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private mailService: MailService,
    private kitsService: KitsService,
  ) { }

  private normalizeDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    return value instanceof Date ? value : new Date(value);
  }

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
    try {
      const asset = await this.prisma.assets.findUniqueOrThrow({
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

      const { _count, borrow_requests: borrowRequests, ...rest } = asset;

      return {
        stock: _count.asset_items,
        borrowerId: borrowRequests[0]?.requester_id ?? null,
        ...rest,
        asset_items: asset.asset_items.map((item) => ({
          ...item,
          costs: item.costs ? Number(item.costs) : null,
        })),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new BadRequestException('Asset not found');
      }
      throw error;
    }
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
      try {
        await this.prisma.assets.findUniqueOrThrow({
          where: { id: assetId },
          select: { id: true },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException('Asset not found');
        }
        throw error;
      }
    }

    return items.map((item) => ({
      ...item,
      costs: item.costs ? Number(item.costs) : null,
    }));
  }

  async createAsset(body: CreateAssetDto, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const category = await this.checkCategory(body.category_name, db);
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
      : (category.salvage_value ?? BigInt(0));
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

    const createdAsset = await db.assets.create({
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
    await this.recomputeAssetStatus(createdAsset.id, null, AssetStatus.READY, db);

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
        ...(specs !== undefined && {
          asset_specs: {
            upsert: {
              update: {
                specs: JSON.parse(JSON.stringify(specs ?? {})),
              },
              create: {
                specs: JSON.parse(JSON.stringify(specs ?? {})),
              },
            },
          },
        }),
      },
    });

    return asset;
  }

  async updateAssetItem(itemId: string, body: EditAssetItemDto, userId: string) {
    const data = EditAssetItemDtoSchema.parse(body);

    try {
      const updated = await this.prisma.assetItems.update({
        where: { id: itemId },
        data: {
          ...(data.location_name !== undefined && { location_name: data.location_name }),
          ...(data.costs !== undefined && { costs: BigInt(Math.round(data.costs)) }),
        },
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
      });

      return {
        ...updated,
        costs: updated.costs ? Number(updated.costs) : null,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Asset item not found');
      }
      throw error;
    }
  }

  protected async checkCategory(category_name: string, db?: Prisma.TransactionClient | PrismaService) {
    const client = db ?? this.prisma;
    return await client.assetsCategories.findFirst({
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

  /**
   * Set an asset item to MAINTAINANCE status.
   * Any authenticated user or admin can call this.
   * Sends email notification to all admins.
   */
  async setMaintenance(body: SetMaintenanceDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      let item: any;
      try {
        item = await tx.assetItems.update({
          where: {
            id: body.asset_item_id,
            status: { notIn: [AssetStatus.MAINTAINANCE, AssetStatus.LIQUIDATED] },
          },
          data: {
            status: AssetStatus.MAINTAINANCE,
            maintenance_notes: body.maintenance_notes,
            last_maintained_at: new Date(),
          },
          include: {
            asset: { select: { id: true, name: true } },
            kit: { select: { id: true } },
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          throw new BadRequestException('Asset item not found or cannot be sent to maintenance');
        }
        throw err;
      }

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
      const newStatus = body.resolved_status as AssetStatus;

      let item: any;
      try {
        item = await tx.assetItems.update({
          where: { id: body.asset_item_id, status: AssetStatus.MAINTAINANCE },
          data: {
            status: newStatus,
            maintenance_notes: null,
            last_maintained_at: new Date(),
          },
          include: {
            asset: { select: { id: true } },
            kit: { select: { id: true } },
          },
        });

        // Create repair record after confirming item exists and was in maintenance
        await tx.assetRepairs.create({
          data: {
            asset_item_id: body.asset_item_id,
            cost: BigInt(body.repair_cost ?? 0),
            description: body.description ?? null,
            resolved_status: newStatus,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2025' || err.code === 'P2003') {
            throw new BadRequestException('Asset item not found or is not in maintenance');
          }
        }
        throw err;
      }

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

  private async loadExportSummary(): Promise<SummaryData> {
    const [
      totalAssetModels,
      totalPhysicalUnits,
      totalKits,
      totalValueAgg,
      totalRepairAgg,
      itemsByStatus,
      assetsByStatus,
      kitsByStatus,
    ] = await Promise.all([
      this.prisma.assets.count(),
      this.prisma.assetItems.count(),
      this.prisma.assetsKits.count(),
      this.prisma.assetItems.aggregate({ _sum: { costs: true } }),
      this.prisma.assetRepairs.aggregate({ _sum: { cost: true } }),
      this.prisma.assetItems.groupBy({ by: ['status'], _count: true }),
      this.prisma.assets.groupBy({ by: ['status'], _count: true }),
      this.prisma.assetsKits.groupBy({ by: ['status'], _count: true }),
    ]);

    const mapStatus = (
      groups: { status: AssetStatus; _count: number }[],
    ): Record<string, number> => {
      const m: Record<string, number> = {
        READY: 0,
        IN_USE: 0,
        MAINTAINANCE: 0,
        BROKEN: 0,
        LIQUIDATED: 0,
      };
      for (const g of groups) m[g.status] = g._count;
      return m;
    };

    return {
      totalAssetModels,
      totalPhysicalUnits,
      totalKits,
      totalValue: Number(totalValueAgg._sum.costs ?? 0),
      totalRepairCost: Number(totalRepairAgg._sum.cost ?? 0),
      itemsByStatus: mapStatus(itemsByStatus as any),
      assetsByStatus: mapStatus(assetsByStatus as any),
      kitsByStatus: mapStatus(kitsByStatus as any),
    };
  }

  private async loadExportInventory(): Promise<InventoryRow[]> {
    const items = await this.prisma.assetItems.findMany({
      include: {
        asset: {
          include: {
            category: true,
            asset_allocation: {
              include: { user: { select: { first_name: true, last_name: true } } },
            },
          },
        },
        kit: { include: { template: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    return items.map((i) => {
      const alloc = i.asset.asset_allocation?.[0];
      const allocName = alloc?.user
        ? `${alloc.user.first_name} ${alloc.user.last_name}`
        : alloc?.kit_id
          ? `Kit ${alloc.kit_id}`
          : null;

      const depMethod =
        i.asset.depreciation_method ??
        i.asset.category?.default_depreciation_method ??
        null;

      return {
        assetCode: i.asset.code,
        assetName: i.asset.name,
        category: i.asset.category?.name ?? '',
        itemId: i.id,
        status: i.status,
        location: i.location_name ?? '',
        inKit: i.kit_status,
        kitId: i.kit_id,
        cost: Number(i.costs),
        acquiredAt: this.normalizeDate(i.acquired_at) ?? new Date(),
        lastMaintained: this.normalizeDate(i.last_maintained_at),
        allocatedTo: allocName,
        depreciationMethod: depMethod,
      };
    });
  }

  private async loadExportFinancial(): Promise<FinancialRow[]> {
    const items = await this.prisma.assetItems.findMany({
      include: {
        asset: { include: { category: true } },
        repairs: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const now = new Date();

    return items.map((i) => {
      const acquiredAt = this.normalizeDate(i.acquired_at) ?? new Date();
      const asset = i.asset;
      const cat = asset.category;
      const originalCost = Number(i.costs);

      const salvage = Number(asset.salvage_value ?? cat?.salvage_value ?? 0);
      const lifeMonths = asset.life_months ?? cat?.default_life_months ?? null;
      const method: DepreciationMethod | null =
        asset.depreciation_method ?? cat?.default_depreciation_method ?? null;
      const declineRate = asset.decline_balance_rate ?? cat?.decline_balance_rate ?? null;

      let accDep = 0;
      if (method && lifeMonths && lifeMonths > 0) {
        const monthsElapsed = Math.max(
          0,
          (now.getFullYear() - acquiredAt.getFullYear()) * 12 +
            (now.getMonth() - acquiredAt.getMonth()),
        );

        if (method === DepreciationMethod.STRAIGHT_LINE) {
          const monthlyDep = (originalCost - salvage) / lifeMonths;
          accDep = Math.min(monthlyDep * monthsElapsed, originalCost - salvage);
        } else if (method === DepreciationMethod.DECLINING_BALANCE && declineRate) {
          let remaining = originalCost;
          const rate = declineRate / 100;
          for (let m = 0; m < monthsElapsed; m++) {
            const dep = remaining * rate / 12;
            remaining -= dep;
            if (remaining <= salvage) {
              remaining = salvage;
              break;
            }
          }
          accDep = originalCost - remaining;
        }
      }

      const totalRepairCost = i.repairs.reduce(
        (sum, r) => sum + Number(r.cost),
        0,
      );

      const bookValue = Math.max(0, originalCost - accDep);

      return {
        assetCode: asset.code,
        assetName: asset.name,
        itemId: i.id,
        originalCost,
        salvageValue: salvage,
        lifeMonths,
        depreciationMethod: method,
        declineBalanceRate: declineRate,
        accumulatedDepreciation: Math.round(accDep),
        currentBookValue: Math.round(bookValue),
        totalRepairCost,
        netAssetValue: Math.round(bookValue - totalRepairCost),
      };
    });
  }

  private async loadExportAllocations(): Promise<AllocationRow[]> {
    const items = await this.prisma.assetItems.findMany({
      include: {
        asset: {
          include: {
            asset_allocation: {
              include: {
                user: {
                  select: { first_name: true, last_name: true, department: true },
                },
              },
            },
            borrow_requests: {
              where: { status: { in: ['APPROVED', 'PROVIDED', 'OVERDUE'] } },
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    const now = new Date();

    return items.map((i) => {
      const alloc = i.asset.asset_allocation?.[0];
      const borrow = i.asset.borrow_requests?.[0];
      const user = alloc?.user;

      return {
        assetCode: i.asset.code,
        assetName: i.asset.name,
        itemId: i.id,
        status: i.status,
        allocatedToUser: user
          ? `${user.first_name} ${user.last_name}`
          : null,
        department: user?.department ?? null,
        allocatedAt: this.normalizeDate(alloc?.allocated_at),
        borrowDueDate: this.normalizeDate(borrow?.due_date),
        overdue: this.normalizeDate(borrow?.due_date)
          ? (this.normalizeDate(borrow?.due_date) as Date) < now
          : false,
      };
    });
  }

  private async loadExportRepairs(): Promise<RepairRow[]> {
    const items = await this.prisma.assetItems.findMany({
      include: {
        asset: { select: { code: true, name: true } },
        repairs: { orderBy: { created_at: 'desc' } },
      },
      orderBy: { created_at: 'asc' },
    });

    return items.map((i) => ({
      assetCode: i.asset.code,
      assetName: i.asset.name,
      itemId: i.id,
      repairCount: i.repairs.length,
      totalRepairCost: i.repairs.reduce((s, r) => s + Number(r.cost), 0),
      lastRepairDate: this.normalizeDate(i.repairs[0]?.created_at),
      lastResolvedStatus: i.repairs[0]?.resolved_status ?? null,
      maintenanceNotes: i.maintenance_notes,
    }));
  }

  private async loadExportKits(): Promise<KitRow[]> {
    const kits = await this.prisma.assetsKits.findMany({
      include: {
        template: true,
        asset_items: { include: { asset: { select: { code: true, name: true } } } },
        asset_allocations: {
          include: {
            user: { select: { first_name: true, last_name: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return kits.map((k) => {
      const statuses = new Set(k.asset_items.map((ai) => ai.status));
      const consistency =
        statuses.size === 0
          ? 'Empty'
          : statuses.size === 1
            ? `All ${[...statuses][0]}`
            : 'Mixed';

      const alloc = k.asset_allocations?.[0];
      const allocTo = alloc?.user
        ? `${alloc.user.first_name} ${alloc.user.last_name}`
        : null;

      return {
        kitId: k.id,
        templateName: k.template.name,
        kitStatus: k.status,
        itemCount: k.asset_items.length,
        items: k.asset_items.map((ai) => `${ai.asset.code} (${ai.asset.name})`).join(', '),
        allocatedTo: allocTo,
        statusConsistency: consistency,
      };
    });
  }

  private async loadExportAudit(): Promise<AuditRow[]> {
    const logs = await this.prisma.auditLogs.findMany({
      include: { user: { select: { first_name: true, last_name: true } } },
      orderBy: { created_at: 'desc' },
      take: 500,
    });

    return logs.map((l) => ({
      timestamp: this.normalizeDate(l.created_at) ?? new Date(),
      actor: `${l.user.first_name} ${l.user.last_name}`,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      before: JSON.stringify(l.before),
      after: JSON.stringify(l.after),
    }));
  }

  async generateExcelReport(): Promise<Buffer> {
    const [summary, inventory, financial, allocations, repairs, kits, audit] =
      await Promise.all([
        this.loadExportSummary(),
        this.loadExportInventory(),
        this.loadExportFinancial(),
        this.loadExportAllocations(),
        this.loadExportRepairs(),
        this.loadExportKits(),
        this.loadExportAudit(),
      ]);

    const wb = XLSX.utils.book_new();

    // sheet 1 — Summary
    const summaryRows = [
      ['Asset Storage Report'],
      ['Generated', new Date().toISOString()],
      [],
      ['Metric', 'Count'],
      ['Total Asset Models', summary.totalAssetModels],
      ['Total Physical Units', summary.totalPhysicalUnits],
      ['Total Asset Kits', summary.totalKits],
      ['Total Value', summary.totalValue],
      ['Total Repair Cost', summary.totalRepairCost],
      [],
      ['Items by Status'],
      ...Object.entries(summary.itemsByStatus).map(([k, v]) => [`  ${k}`, v]),
      [],
      ['Assets by Status'],
      ...Object.entries(summary.assetsByStatus).map(([k, v]) => [`  ${k}`, v]),
      [],
      ['Kits by Status'],
      ...Object.entries(summary.kitsByStatus).map(([k, v]) => [`  ${k}`, v]),
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // sheet 2 — Inventory
    const wsInventory = XLSX.utils.json_to_sheet(
      inventory.map((r) => ({
        'Asset Code': r.assetCode,
        'Asset Name': r.assetName,
        Category: r.category,
        'Item ID': r.itemId,
        Status: r.status,
        Location: r.location,
        'In Kit': r.inKit ? 'Yes' : 'No',
        'Kit ID': r.kitId ?? '',
        Cost: r.cost,
        'Acquired Date': r.acquiredAt?.toISOString().split('T')[0] ?? '',
        'Last Maintained': r.lastMaintained?.toISOString().split('T')[0] ?? '',
        'Allocated To': r.allocatedTo ?? '',
        'Depreciation Method': r.depreciationMethod ?? '',
      })),
    );
    XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory');

    // sheet 3 — Financial
    const wsFinancial = XLSX.utils.json_to_sheet(
      financial.map((r) => ({
        'Asset Code': r.assetCode,
        'Asset Name': r.assetName,
        'Item ID': r.itemId,
        'Original Cost': r.originalCost,
        'Salvage Value': r.salvageValue,
        'Life (months)': r.lifeMonths ?? '',
        'Depreciation Method': r.depreciationMethod ?? '',
        'Decline Rate (%)': r.declineBalanceRate ?? '',
        'Accumulated Depreciation': r.accumulatedDepreciation,
        'Current Book Value': r.currentBookValue,
        'Total Repair Cost': r.totalRepairCost,
        'Net Asset Value': r.netAssetValue,
      })),
    );
    XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financial');

    // sheet 4 — Allocations
    const wsAlloc = XLSX.utils.json_to_sheet(
      allocations.map((r) => ({
        'Asset Code': r.assetCode,
        'Asset Name': r.assetName,
        'Item ID': r.itemId,
        Status: r.status,
        'Allocated To': r.allocatedToUser ?? '',
        Department: r.department ?? '',
        'Allocated At': r.allocatedAt?.toISOString().split('T')[0] ?? '',
        'Borrow Due Date': r.borrowDueDate?.toISOString().split('T')[0] ?? '',
        Overdue: r.overdue ? 'YES' : '',
      })),
    );
    XLSX.utils.book_append_sheet(wb, wsAlloc, 'Allocations');

    // sheet 5 — Repairs
    const wsRepairs = XLSX.utils.json_to_sheet(
      repairs.map((r) => ({
        'Asset Code': r.assetCode,
        'Asset Name': r.assetName,
        'Item ID': r.itemId,
        'Repair Count': r.repairCount,
        'Total Repair Cost': r.totalRepairCost,
        'Last Repair Date': r.lastRepairDate?.toISOString().split('T')[0] ?? '',
        'Last Resolved Status': r.lastResolvedStatus ?? '',
        'Maintenance Notes': r.maintenanceNotes ?? '',
      })),
    );
    XLSX.utils.book_append_sheet(wb, wsRepairs, 'Repairs');

    // sheet 6 — Kits
    const wsKits = XLSX.utils.json_to_sheet(
      kits.map((r) => ({
        'Kit ID': r.kitId,
        'Template Name': r.templateName,
        Status: r.kitStatus,
        'Item Count': r.itemCount,
        Items: r.items,
        'Allocated To': r.allocatedTo ?? '',
        'Status Consistency': r.statusConsistency,
      })),
    );
    XLSX.utils.book_append_sheet(wb, wsKits, 'Kits');

    // sheet 7 — Audit Logs
    const wsAudit = XLSX.utils.json_to_sheet(
      audit.map((r) => ({
        Timestamp: r.timestamp.toISOString(),
        Actor: r.actor,
        Action: r.action,
        'Entity Type': r.entityType,
        'Entity ID': r.entityId,
        Before: r.before,
        After: r.after,
      })),
    );
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Logs');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf as Buffer;
  }

  async generatePdfReport(): Promise<Buffer> {
    const [summary, inventory, financial, allocations, repairs, kits, audit] =
      await Promise.all([
        this.loadExportSummary(),
        this.loadExportInventory(),
        this.loadExportFinancial(),
        this.loadExportAllocations(),
        this.loadExportRepairs(),
        this.loadExportKits(),
        this.loadExportAudit(),
      ]);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
        bufferPages: true,
        info: {
          Title: 'Asset Storage Report',
          Author: 'Asset Management System',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const PAGE_W = doc.page.width - 80;
      const headerColor = '#1e40af';
      const lightBg = '#f0f4ff';

      const addSectionTitle = (title: string) => {
        doc
          .moveDown(1)
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor(headerColor)
          .text(title, { underline: true })
          .moveDown(0.5);
      };

      const addKV = (label: string, value: string | number) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#374151')
          .text(`${label}: `, { continued: true })
          .font('Helvetica')
          .text(String(value));
      };

      const drawTable = (
        headers: string[],
        rows: string[][],
        colWidths?: number[],
      ) => {
        const cols = headers.length;
        const widths = colWidths ?? headers.map(() => Math.floor(PAGE_W / cols));
        const rowH = 18;
        let y = doc.y;

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        let x = 40;
        for (let c = 0; c < cols; c++) {
          doc
            .save()
            .rect(x, y, widths[c], rowH)
            .fill(headerColor)
            .restore()
            .fillColor('#ffffff')
            .text(headers[c], x + 3, y + 4, {
              width: widths[c] - 6,
              height: rowH,
              ellipsis: true,
            });
          x += widths[c];
        }
        y += rowH;

        // body
        doc.font('Helvetica').fontSize(7).fillColor('#1f2937');
        for (let r = 0; r < rows.length; r++) {
          if (y + rowH > doc.page.height - 40) {
            doc.addPage();
            y = 40;
          }
          x = 40;
          const bg = r % 2 === 0 ? lightBg : '#ffffff';
          for (let c = 0; c < cols; c++) {
            doc
              .save()
              .rect(x, y, widths[c], rowH)
              .fill(bg)
              .restore()
              .fillColor('#1f2937')
              .text(rows[r]?.[c] ?? '', x + 3, y + 4, {
                width: widths[c] - 6,
                height: rowH,
                ellipsis: true,
              });
            x += widths[c];
          }
          y += rowH;
        }

        doc.y = y + 4;
      };

      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor(headerColor)
        .text('Asset Storage Report', { align: 'center' })
        .moveDown(0.5)
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`Generated: ${new Date().toISOString().split('T')[0]}`, {
          align: 'center',
        })
        .text('Asset Management System', { align: 'center' });

      doc.addPage();
      addSectionTitle('1. Executive Summary');

      addKV('Total Asset Models', summary.totalAssetModels);
      addKV('Total Physical Units', summary.totalPhysicalUnits);
      addKV('Total Asset Kits', summary.totalKits);
      addKV('Total Value', summary.totalValue.toLocaleString());
      addKV('Total Repair Cost', summary.totalRepairCost.toLocaleString());

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#374151').text('Items by Status:');
      for (const [s, c] of Object.entries(summary.itemsByStatus)) addKV(`  ${s}`, c);

      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#374151').text('Assets by Status:');
      for (const [s, c] of Object.entries(summary.assetsByStatus)) addKV(`  ${s}`, c);

      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#374151').text('Kits by Status:');
      for (const [s, c] of Object.entries(summary.kitsByStatus)) addKV(`  ${s}`, c);

      doc.addPage();
      addSectionTitle('2. Inventory Overview');
      {
        const headers = [
          'Code', 'Name', 'Category', 'Item ID', 'Status',
          'Location', 'Kit?', 'Cost', 'Acquired', 'Allocated To', 'Dep. Method',
        ];
        const colW = [55, 80, 65, 70, 55, 80, 30, 55, 60, 80, 70];
        const rows = inventory.map((r) => [
          r.assetCode,
          r.assetName,
          r.category,
          r.itemId.substring(0, 8),
          r.status,
          r.location,
          r.inKit ? 'Y' : 'N',
          r.cost.toLocaleString(),
          r.acquiredAt?.toISOString().split('T')[0] ?? '',
          r.allocatedTo ?? '',
          r.depreciationMethod ?? '',
        ]);
        drawTable(headers, rows, colW);
      }

      doc.addPage();
      addSectionTitle('3. Financial Data');
      {
        const headers = [
          'Code', 'Name', 'Item ID', 'Orig. Cost', 'Salvage',
          'Life (mo)', 'Method', 'Acc. Dep.', 'Book Value', 'Repair $', 'Net Value',
        ];
        const colW = [55, 80, 65, 60, 50, 45, 65, 60, 60, 55, 55];
        const rows = financial.map((r) => [
          r.assetCode,
          r.assetName,
          r.itemId.substring(0, 8),
          r.originalCost.toLocaleString(),
          r.salvageValue.toLocaleString(),
          r.lifeMonths?.toString() ?? '',
          r.depreciationMethod ?? '',
          r.accumulatedDepreciation.toLocaleString(),
          r.currentBookValue.toLocaleString(),
          r.totalRepairCost.toLocaleString(),
          r.netAssetValue.toLocaleString(),
        ]);
        drawTable(headers, rows, colW);
      }

      doc.addPage();
      addSectionTitle('4. Allocation / Usage');
      {
        const headers = [
          'Code', 'Name', 'Item ID', 'Status', 'Allocated To',
          'Department', 'Allocated At', 'Due Date', 'Overdue',
        ];
        const colW = [60, 90, 70, 60, 90, 75, 75, 75, 50];
        const rows = allocations.map((r) => [
          r.assetCode,
          r.assetName,
          r.itemId.substring(0, 8),
          r.status,
          r.allocatedToUser ?? '',
          r.department ?? '',
          r.allocatedAt?.toISOString().split('T')[0] ?? '',
          r.borrowDueDate?.toISOString().split('T')[0] ?? '',
          r.overdue ? 'YES' : '',
        ]);
        drawTable(headers, rows, colW);
      }

      doc.addPage();
      addSectionTitle('5. Maintenance & Repairs');
      {
        const headers = [
          'Code', 'Name', 'Item ID', 'Repairs', 'Total Cost',
          'Last Repair', 'Resolved Status', 'Notes',
        ];
        const colW = [60, 90, 70, 50, 65, 75, 80, 160];
        const rows = repairs.map((r) => [
          r.assetCode,
          r.assetName,
          r.itemId.substring(0, 8),
          r.repairCount.toString(),
          r.totalRepairCost.toLocaleString(),
          r.lastRepairDate?.toISOString().split('T')[0] ?? '',
          r.lastResolvedStatus ?? '',
          r.maintenanceNotes ?? '',
        ]);
        drawTable(headers, rows, colW);
      }

      doc.addPage();
      addSectionTitle('6. Kit Overview');
      {
        const headers = [
          'Kit ID', 'Template', 'Status', 'Items', 'Included Items',
          'Allocated To', 'Consistency',
        ];
        const colW = [70, 90, 60, 40, 210, 90, 80];
        const rows = kits.map((r) => [
          r.kitId.substring(0, 8),
          r.templateName,
          r.kitStatus,
          r.itemCount.toString(),
          r.items,
          r.allocatedTo ?? '',
          r.statusConsistency,
        ]);
        drawTable(headers, rows, colW);
      }

      /* ── 7. Audit Logs ── */
      doc.addPage();
      addSectionTitle('7. Audit Logs (Recent)');
      {
        const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Entity ID'];
        const colW = [110, 100, 120, 90, 220];
        const rows = audit.slice(0, 200).map((r) => [
          r.timestamp.toISOString(),
          r.actor,
          r.action,
          r.entityType,
          r.entityId,
        ]);
        drawTable(headers, rows, colW);
      }

      doc.end();
    });
  }

  async exportStorageReport(
    format: string,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const generators: Record<
      string,
      () => Promise<{ buffer: Buffer; contentType: string; filename: string }>
    > = {
      pdf: async () => ({
        buffer: await this.generatePdfReport(),
        contentType: 'application/pdf',
        filename: `asset-report-${Date.now()}.pdf`,
      }),
      excel: async () => ({
        buffer: await this.generateExcelReport(),
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `asset-report-${Date.now()}.xlsx`,
      }),
    };

    const generator = generators[format?.toLowerCase()];

    if (!generator) {
      throw new BadRequestException(
        'Unsupported format. Use "pdf" or "excel".',
      );
    }

    return generator();
  }
}
