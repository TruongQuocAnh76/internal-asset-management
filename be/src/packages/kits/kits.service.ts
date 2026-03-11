import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ItemStatus, TemplateStatus, Prisma } from '@prisma/client';
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
    const transformedKits = kits.map((kit) => ({
      ...kit,
      asset_items: kit.asset_items.map((item) => ({
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
    try {
      const kit = await this.prisma.assetsKits.findUniqueOrThrow({
        where: { id },
        include: KIT_INCLUDE,
      });

      return {
        ...kit,
        asset_items: kit.asset_items.map((item) => ({
          ...item,
          costs: item.costs ? Number(item.costs) : null,
        })),
      };
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

  async createKit(body: CreateKitDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // check for duplicate template
      const duplicateTemplateId = await this.checkDuplicateTemplate(
        body.asset_ids,
        tx,
      );

      if (duplicateTemplateId) {
        // Create another kit instance for the existing template
        const newKit = await tx.assetsKits.create({
          data: {
            template_id: duplicateTemplateId,
            status: TemplateStatus.AVAILABLE,
          },
          include: KIT_INCLUDE,
        });

        return newKit;
      }

      // check asset item status
      const assets_status = await tx.assets.findMany({
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

      // kit status: AVAILABLE if all assets are AVAILABLE, otherwise UNAVAILABLE
      const allReady = assets_status.every(
        (asset) => asset.status === TemplateStatus.AVAILABLE,
      );
      const kitStatus = allReady
        ? TemplateStatus.AVAILABLE
        : TemplateStatus.UNAVAILABLE;

      // create template + kit instance
      const template = await tx.kitTemplates.create({
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

      const newKit = await tx.assetsKits.create({
        data: {
          template_id: template.id,
          status: kitStatus,
        },
        include: KIT_INCLUDE,
      });

      await tx.assetItems.updateMany({
        where: {
          asset_id: { in: body.asset_ids },
          kit_id: null,
        },
        data: {
          kit_id: newKit.id,
          kit_status: true,
        },
      });

      return newKit;
    });
  }

  async updateKit(id: string, body: UpdateKitDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const kit = await tx.assetsKits.findUniqueOrThrow({
          where: { id },
          include: KIT_INCLUDE,
        });

        if (body.name) {
          await tx.kitTemplates.update({
            where: { id: kit.template_id },
            data: { name: body.name },
          });
        }

        return await tx.assetsKits.findUniqueOrThrow({
          where: { id },
          include: KIT_INCLUDE,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Asset kit not found');
        }
        throw error;
      }
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
    body: {
      assetId?: string;
      assetType: string;
      quantity: number;
      isPlaceholder: boolean;
    },
    userId: string,
  ) {
    if (body.isPlaceholder || !body.assetId) {
      return { message: 'Placeholder component added' };
    }

    const assetId = body.assetId;

    await this.prisma.$transaction(async (tx) => {
      try {
        const kit = await tx.assetsKits.findUniqueOrThrow({
          where: { id: kitId },
        });

        await tx.kitTemplateItems.create({
          data: {
            template_id: kit.template_id,
            asset_id: assetId,
          },
        });

        await this.refreshKitAndTemplateStatus(kitId, tx);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025')
            throw new NotFoundException('Asset kit not found');
          if (error.code === 'P2003')
            throw new NotFoundException('Asset not found');
        }
        throw error;
      }
    });

    return this.getKitById(kitId);
  }

  async removeComponentFromKit(kitId: string, assetId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      try {
        const kit = await tx.assetsKits.findUniqueOrThrow({
          where: { id: kitId },
        });

        await tx.kitTemplateItems.deleteMany({
          where: {
            template_id: kit.template_id,
            asset_id: assetId,
          },
        });

        await this.refreshKitAndTemplateStatus(kitId, tx);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Asset kit not found');
        }
        throw error;
      }
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
      try {
        const kit = await tx.assetsKits.findUniqueOrThrow({
          where: { id: kitId },
        });

        await tx.kitTemplateItems.deleteMany({
          where: {
            template_id: kit.template_id,
            asset_id: oldAssetId,
          },
        });

        await tx.kitTemplateItems.create({
          data: {
            template_id: kit.template_id,
            asset_id: newAssetId,
          },
        });

        await this.refreshKitAndTemplateStatus(kitId, tx);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025')
            throw new NotFoundException('Asset kit not found');
          if (error.code === 'P2003')
            throw new NotFoundException('Replacement asset not found');
        }
        throw error;
      }
    });

    return this.getKitById(kitId);
  }

  async convertComponentToPlaceholder(
    kitId: string,
    assetId: string,
    userId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      try {
        const kit = await tx.assetsKits.findUniqueOrThrow({
          where: { id: kitId },
        });

        await tx.kitTemplateItems.deleteMany({
          where: {
            template_id: kit.template_id,
            asset_id: assetId,
          },
        });

        await this.refreshKitAndTemplateStatus(kitId, tx);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Asset kit not found');
        }
        throw error;
      }
    });

    return this.getKitById(kitId);
  }

  /**
   * Full recompute of kit status and its parent template status from scratch.
   * Used after template composition changes (add/remove/replace components).
   */
  async refreshKitAndTemplateStatus(kitId: string, tx?: any): Promise<void> {
    const client = tx ?? this.prisma;
    const notReadyCount = await client.assetItems.count({
      where: { kit_id: kitId, status: { not: ItemStatus.READY } },
    });
    const newKitStatus =
      notReadyCount === 0
        ? TemplateStatus.AVAILABLE
        : TemplateStatus.UNAVAILABLE;
    await client.assetsKits.update({
      where: { id: kitId },
      data: { status: newKitStatus },
    });
    const kit = await client.assetsKits.findUnique({
      where: { id: kitId },
      select: { template_id: true },
    });
    if (!kit) return;
    const availableKitCount = await client.assetsKits.count({
      where: { template_id: kit.template_id, status: TemplateStatus.AVAILABLE },
    });
    const newTemplateStatus =
      availableKitCount > 0
        ? TemplateStatus.AVAILABLE
        : TemplateStatus.UNAVAILABLE;
    await client.kitTemplates.update({
      where: { id: kit.template_id },
      data: { status: newTemplateStatus },
    });
  }

  protected async checkDuplicateTemplate(
    asset_ids: string[],
    tx?: any,
  ): Promise<string | null> {
    const client = tx ?? this.prisma;
    const templates = await client.kitTemplates.findMany({
      include: {
        template_items: {
          select: { asset_id: true },
        },
      },
    });

    for (const template of templates) {
      const templateAssetIds = template.template_items.map(
        (item) => item.asset_id,
      );
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
        where.status = query.filterValue as TemplateStatus;
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

  /**
   * Recompute cached status on the AssetsKits row and its KitTemplates parent.
   * AVAILABLE if all items in the kit are READY, otherwise UNAVAILABLE.
   * KitTemplates is AVAILABLE only if ALL of its kit instances are AVAILABLE.
   */
  async recomputeKitStatus(
    kitId: string,
    staleKitStatus: TemplateStatus,
    updatedKitItemStatus: ItemStatus,
    deletedItem: boolean,
    tx?: any,
  ): Promise<TemplateStatus> {
    const client = tx ?? this.prisma;
    // CASE ITEM STATUS UPDATE
    if (!deletedItem) {
      if (updatedKitItemStatus !== ItemStatus.READY) {
        return TemplateStatus.UNAVAILABLE;
      }
      if (staleKitStatus === TemplateStatus.AVAILABLE) {
        return TemplateStatus.AVAILABLE;
      }
      // item update to ready, kit is not available
      const notReadyCount = await client.assetItems.count({
        where: {
          kit_id: kitId,
          status: { not: { equals: ItemStatus.READY } },
        },
      });
      if (notReadyCount == 1) return TemplateStatus.AVAILABLE;
      return TemplateStatus.UNAVAILABLE;
    }
    // CASE ITEM DELETION
    if (staleKitStatus === TemplateStatus.AVAILABLE)
      return TemplateStatus.AVAILABLE;
    if (updatedKitItemStatus !== ItemStatus.READY) {
      const notReadyCount = await client.assetItems.count({
        where: {
          kit_id: kitId,
          status: { not: { equals: ItemStatus.READY } },
        },
      });
      if (notReadyCount == 1) return TemplateStatus.AVAILABLE; // the deleted item is the only not READY item, so kit becomes AVAILABLE
      return TemplateStatus.UNAVAILABLE;
    }
    return TemplateStatus.UNAVAILABLE; // kit unavailable, deleted item was READY, other not-READY items remain
  }

  /**
   * Logic is similar to asset status
   */
  async recomputeKitTemplateStatus(
    kitTemplateId: string,
    staleKitTemplateStatus: TemplateStatus,
    updatedKitStatus: TemplateStatus,
    deletedKit: boolean,
    tx?: any,
  ) {
    const client = tx ?? this.prisma;
    // CASE KIT STATUS UPDATE
    if (!deletedKit) {
      if (updatedKitStatus === TemplateStatus.AVAILABLE) {
        return TemplateStatus.AVAILABLE;
      }
      if (staleKitTemplateStatus === TemplateStatus.UNAVAILABLE) {
        return TemplateStatus.UNAVAILABLE;
      }
      const availableCount = await client.assetsKits.count({
        where: { template_id: kitTemplateId, status: TemplateStatus.AVAILABLE },
      });
      if (availableCount === 0) {
        return TemplateStatus.UNAVAILABLE;
      }
      return TemplateStatus.AVAILABLE;
    }
    // CASE KIT DELETION
    const remainingKitCount = await client.assetsKits.count({
      where: { template_id: kitTemplateId },
    });
    return remainingKitCount === 0
      ? TemplateStatus.UNAVAILABLE
      : TemplateStatus.AVAILABLE;
  }
}
