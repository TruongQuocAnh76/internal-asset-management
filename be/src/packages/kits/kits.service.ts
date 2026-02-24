import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus, Prisma } from '@prisma/client';
import { CreateKitDto, UpdateKitDto } from './dto/create-kit.dto';
import { GetKitsParams } from './dto/get-kits-params.dto';

const KIT_INCLUDE = {
  template: {
    include: {
      template_items: {
        include: {
          asset: true,
        },
      },
    },
  },
  asset_items: true,
} as const;

@Injectable()
export class KitsService {
  constructor(private prisma: PrismaService) {}

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
      include: KIT_INCLUDE,
    });

    const totalKitsCount = await this.prisma.assetsKits.count({ where: where });

    // Convert BigInt costs to numbers
    const transformedKits = kits.map(kit => ({
      ...kit,
      asset_items: kit.asset_items.map(item => ({
        ...item,
        costs: item.costs ? Number(item.costs) : null,
      })),
    }));

    return {
      data: transformedKits,
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
      include: KIT_INCLUDE,
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    return {
      ...kit,
      asset_items: kit.asset_items.map(item => ({
        ...item,
        costs: item.costs ? Number(item.costs) : null,
      })),
    };
  }

  async createKit(body: CreateKitDto, userId: string) {
    // check for duplicate template
    const duplicateTemplateId = await this.checkDuplicateTemplate(body.asset_ids);

    if (duplicateTemplateId) {
      // Create another kit instance for the existing template
      const newKit = await this.prisma.assetsKits.create({
        data: {
          template_id: duplicateTemplateId,
          status: AssetStatus.READY,
        },
        include: KIT_INCLUDE,
      });

      return newKit;
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

    // kit status: READY if all assets are READY, otherwise IN_USE
    const allReady = assets_status.every(
      (asset) => asset.status === AssetStatus.READY,
    );
    const kitStatus = allReady ? AssetStatus.READY : AssetStatus.IN_USE;

    // create template + kit instance
    const template = await this.prisma.kitTemplates.create({
      data: {
        name: body.name,
        status: kitStatus,
        template_items: {
          createMany: {
            data: body.asset_ids.map((asset_id) => ({ asset_id })),
          },
        },
      },
    });

    const newKit = await this.prisma.assetsKits.create({
      data: {
        template_id: template.id,
        status: kitStatus,
      },
      include: KIT_INCLUDE,
    });

    return newKit;
  }

  async updateKit(id: string, body: UpdateKitDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const kit = await tx.assetsKits.findUnique({
        where: { id },
        include: KIT_INCLUDE,
      });

      if (!kit) {
        throw new NotFoundException('Asset kit not found');
      }

      if (body.name) {
        await tx.kitTemplates.update({
          where: { id: kit.template_id },
          data: { name: body.name },
        });
      }

      return tx.assetsKits.findUnique({
        where: { id },
        include: KIT_INCLUDE,
      });
    });
  }

  async deleteKit(id: string, userId: string) {
    try {
      await this.prisma.assetsKits.delete({ where: { id } });
      return { message: 'Asset kit deleted successfully' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Asset kit not found');
      }
      throw error;
    }
  }

  async addComponentToKit(
    kitId: string,
    body: { assetId?: string; assetType: string; quantity: number; isPlaceholder: boolean },
    userId: string,
  ) {
    if (body.isPlaceholder || !body.assetId) {
      return { message: 'Placeholder component added' };
    }

    const assetId = body.assetId;

    await this.prisma.$transaction(async (tx) => {
      const kit = await tx.assetsKits.findUnique({ where: { id: kitId } });
      if (!kit) {
        throw new NotFoundException('Asset kit not found');
      }

      try {
        await tx.kitTemplateItems.create({
          data: {
            template_id: kit.template_id,
            asset_id: assetId,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2003' || error.code === 'P2025')
        ) {
          throw new NotFoundException('Asset not found');
        }
        throw error;
      }

      await this.recomputeKitStatusTx(tx, kitId);
    });

    return this.getKitById(kitId);
  }

  async removeComponentFromKit(kitId: string, assetId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const kit = await tx.assetsKits.findUnique({ where: { id: kitId } });
      if (!kit) {
        throw new NotFoundException('Asset kit not found');
      }

      await tx.kitTemplateItems.deleteMany({
        where: {
          template_id: kit.template_id,
          asset_id: assetId,
        },
      });

      await this.recomputeKitStatusTx(tx, kitId);
    });

    return this.getKitById(kitId);
  }

  async replaceComponentAsset(
    kitId: string,
    oldAssetId: string,
    newAssetId: string,
    userId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const kit = await tx.assetsKits.findUnique({ where: { id: kitId } });
      if (!kit) {
        throw new NotFoundException('Asset kit not found');
      }

      await tx.kitTemplateItems.deleteMany({
        where: {
          template_id: kit.template_id,
          asset_id: oldAssetId,
        },
      });

      try {
        await tx.kitTemplateItems.create({
          data: {
            template_id: kit.template_id,
            asset_id: newAssetId,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2003' || error.code === 'P2025')
        ) {
          throw new NotFoundException('Replacement asset not found');
        }
        throw error;
      }

      await this.recomputeKitStatusTx(tx, kitId);
    });

    return this.getKitById(kitId);
  }

  async convertComponentToPlaceholder(kitId: string, assetId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const kit = await tx.assetsKits.findUnique({ where: { id: kitId } });
      if (!kit) {
        throw new NotFoundException('Asset kit not found');
      }

      await tx.kitTemplateItems.deleteMany({
        where: {
          template_id: kit.template_id,
          asset_id: assetId,
        },
      });

      await this.recomputeKitStatusTx(tx, kitId);
    });

    return this.getKitById(kitId);
  }

  /**
   * Recompute cached status on the AssetsKits row (transaction-aware).
   */
  private async recomputeKitStatusTx(
    tx: any,
    kitId: string,
  ): Promise<AssetStatus> {
    const nonReadyCount = await tx.assetItems.count({
      where: { kit_id: kitId, status: { not: AssetStatus.READY } },
    });
    const newStatus =
      nonReadyCount === 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await tx.assetsKits.update({
      where: { id: kitId },
      data: { status: newStatus },
    });
    const kit = await tx.assetsKits.findUnique({
      where: { id: kitId },
      select: { template_id: true },
    });
    if (kit) {
      await this.recomputeTemplateStatusTx(tx, kit.template_id);
    }
    return newStatus;
  }

  /**
   * Recompute cached status on the KitTemplates row (transaction-aware).
   */
  private async recomputeTemplateStatusTx(
    tx: any,
    templateId: string,
  ): Promise<AssetStatus> {
    const readyKitCount = await tx.assetsKits.count({
      where: { template_id: templateId, status: AssetStatus.READY },
    });
    const newStatus =
      readyKitCount > 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await tx.kitTemplates.update({
      where: { id: templateId },
      data: { status: newStatus },
    });
    return newStatus;
  }

  /**
   * Recompute cached status (non-transaction, for external use).
   */
  async recomputeKitStatus(kitId: string): Promise<AssetStatus> {
    return this.prisma.$transaction((tx) =>
      this.recomputeKitStatusTx(tx, kitId),
    );
  }

  protected async checkDuplicateTemplate(asset_ids: string[]): Promise<string | null> {
    const templates = await this.prisma.kitTemplates.findMany({
      include: {
        template_items: {
          select: { asset_id: true },
        },
      },
    });

    for (const template of templates) {
      const templateAssetIds = template.template_items.map((item) => item.asset_id);
      if (
        templateAssetIds.length === asset_ids.length &&
        templateAssetIds.every((id) => asset_ids.includes(id))
      ) {
        return template.id;
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
      where.template = {
        name: {
          contains: query.search,
          mode: 'insensitive',
        },
      };
    }
    return where;
  }
}
