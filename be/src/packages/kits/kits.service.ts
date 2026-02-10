import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus, Prisma } from '@prisma/client';
import { AuditService } from 'src/core/audit/audit.service';
import { Entity } from 'src/core/enums/entity.enum';
import { CreateKitDto, UpdateKitDto } from './dto/create-kit.dto';
import { GetKitsParams } from './dto/get-kits-params.dto';

@Injectable()
export class KitsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getAllKits(query: GetKitsParams) {
    const where = this.buildWhere(query);
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

  async getKitById(id: string) {
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

  async createKit(body: CreateKitDto, userId: string) {
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

    // kit asset will take the status of the worst condition asset
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

  async updateKit(id: string, body: UpdateKitDto, userId: string) {
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

  async deleteKit(id: string, userId: string) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    await this.prisma.assetsKits.delete({
      where: { id },
    });

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

  async addComponentToKit(
    kitId: string,
    body: { assetId?: string; assetType: string; quantity: number; isPlaceholder: boolean },
    userId: string,
  ) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    if (body.isPlaceholder || !body.assetId) {
      // For placeholder components, just return success (no asset to link)
      await this.auditService.addRecord(
        userId,
        'UPDATE',
        Entity.ASSET_KIT,
        kitId,
        JSON.stringify(kit),
        JSON.stringify({ action: 'add_placeholder_component', assetType: body.assetType }),
      );
      return { message: 'Placeholder component added' };
    }

    // Check asset exists
    const asset = await this.prisma.assets.findUnique({
      where: { id: body.assetId },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    // Add asset to kit
    await this.prisma.assetsKitsItems.create({
      data: {
        kit_id: kitId,
        asset_id: body.assetId,
      },
    });

    await this.auditService.addRecord(
      userId,
      'UPDATE',
      Entity.ASSET_KIT,
      kitId,
      JSON.stringify(kit),
      JSON.stringify({ action: 'add_component', assetId: body.assetId }),
    );

    return this.getKitById(kitId);
  }

  async removeComponentFromKit(kitId: string, assetId: string, userId: string) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    await this.prisma.assetsKitsItems.delete({
      where: {
        kit_id_asset_id: {
          kit_id: kitId,
          asset_id: assetId,
        },
      },
    });

    await this.auditService.addRecord(
      userId,
      'UPDATE',
      Entity.ASSET_KIT,
      kitId,
      JSON.stringify(kit),
      JSON.stringify({ action: 'remove_component', assetId }),
    );

    return this.getKitById(kitId);
  }

  async replaceComponentAsset(
    kitId: string,
    oldAssetId: string,
    newAssetId: string,
    userId: string,
  ) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    const newAsset = await this.prisma.assets.findUnique({
      where: { id: newAssetId },
    });

    if (!newAsset) {
      throw new BadRequestException('Replacement asset not found');
    }

    // Remove old, add new
    await this.prisma.assetsKitsItems.delete({
      where: {
        kit_id_asset_id: {
          kit_id: kitId,
          asset_id: oldAssetId,
        },
      },
    });

    await this.prisma.assetsKitsItems.create({
      data: {
        kit_id: kitId,
        asset_id: newAssetId,
      },
    });

    await this.auditService.addRecord(
      userId,
      'UPDATE',
      Entity.ASSET_KIT,
      kitId,
      JSON.stringify(kit),
      JSON.stringify({ action: 'replace_component', oldAssetId, newAssetId }),
    );

    return this.getKitById(kitId);
  }

  async convertComponentToPlaceholder(kitId: string, assetId: string, userId: string) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    // Remove the specific asset from the kit
    await this.prisma.assetsKitsItems.delete({
      where: {
        kit_id_asset_id: {
          kit_id: kitId,
          asset_id: assetId,
        },
      },
    });

    await this.auditService.addRecord(
      userId,
      'UPDATE',
      Entity.ASSET_KIT,
      kitId,
      JSON.stringify(kit),
      JSON.stringify({ action: 'convert_to_placeholder', assetId }),
    );

    return this.getKitById(kitId);
  }

  protected async checkDuplicateKit(asset_ids: string[]) {
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

  protected buildWhere(query: GetKitsParams): Prisma.AssetsKitsWhereInput {
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
}
