import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus, Prisma } from '@prisma/client';
import { AuditService } from 'src/core/audit/audit.service';
import { Entity } from 'src/core/enums/entity.enum';
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

      await this.auditService.addRecord(
        userId,
        'CREATE',
        Entity.ASSET_KIT,
        newKit.id,
        JSON.stringify({}),
        JSON.stringify({ action: 'create from existing template', templateId: duplicateTemplateId }),
      );

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

    // add audit record
    await this.auditService.addRecord(
      userId,
      'CREATE',
      Entity.ASSET_KIT,
      newKit.id,
      {},
      JSON.stringify(body),
    );

    return newKit;
  }

  async updateKit(id: string, body: UpdateKitDto, userId: string) {
    const initialKit = await this.prisma.assetsKits.findUnique({
      where: { id },
      include: KIT_INCLUDE,
    });

    if (!initialKit) {
      throw new BadRequestException('Asset kit not found');
    }

    // Update the template name if provided
    if (body.name) {
      await this.prisma.kitTemplates.update({
        where: { id: initialKit.template_id },
        data: { name: body.name },
      });
    }

    const updatedKit = await this.prisma.assetsKits.findUnique({
      where: { id },
      include: KIT_INCLUDE,
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

    return updatedKit;
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

    // Add asset to the kit's template
    await this.prisma.kitTemplateItems.create({
      data: {
        template_id: kit.template_id,
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

    // Recompute kit status after adding component
    await this.recomputeKitStatus(kitId);

    return this.getKitById(kitId);
  }

  async removeComponentFromKit(kitId: string, assetId: string, userId: string) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    await this.prisma.kitTemplateItems.deleteMany({
      where: {
        template_id: kit.template_id,
        asset_id: assetId,
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

    // Recompute kit status after removing component
    await this.recomputeKitStatus(kitId);

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
    await this.prisma.kitTemplateItems.deleteMany({
      where: {
        template_id: kit.template_id,
        asset_id: oldAssetId,
      },
    });

    await this.prisma.kitTemplateItems.create({
      data: {
        template_id: kit.template_id,
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

    // Recompute kit status after replacing component
    await this.recomputeKitStatus(kitId);

    return this.getKitById(kitId);
  }

  async convertComponentToPlaceholder(kitId: string, assetId: string, userId: string) {
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
    });

    if (!kit) {
      throw new BadRequestException('Asset kit not found');
    }

    // Remove the specific asset from the kit's template
    await this.prisma.kitTemplateItems.deleteMany({
      where: {
        template_id: kit.template_id,
        asset_id: assetId,
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

    // Recompute kit status after converting to placeholder
    await this.recomputeKitStatus(kitId);

    return this.getKitById(kitId);
  }

  /**
   * Recompute cached status on the AssetsKits row.
   * READY if ALL related asset_items are READY, otherwise IN_USE.
   * Also recomputes the parent KitTemplate status.
   */
  async recomputeKitStatus(kitId: string): Promise<AssetStatus> {
    const nonReadyCount = await this.prisma.assetItems.count({
      where: { kit_id: kitId, status: { not: AssetStatus.READY } },
    });
    const newStatus = nonReadyCount === 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await this.prisma.assetsKits.update({
      where: { id: kitId },
      data: { status: newStatus },
    });
    // Cascade to parent template
    const kit = await this.prisma.assetsKits.findUnique({
      where: { id: kitId },
      select: { template_id: true },
    });
    if (kit) {
      await this.recomputeTemplateStatus(kit.template_id);
    }
    return newStatus;
  }

  /**
   * Recompute cached status on the KitTemplates row.
   * READY if at least 1 of its asset_kits is READY, otherwise IN_USE.
   */
  async recomputeTemplateStatus(templateId: string): Promise<AssetStatus> {
    const readyKitCount = await this.prisma.assetsKits.count({
      where: { template_id: templateId, status: AssetStatus.READY },
    });
    const newStatus = readyKitCount > 0 ? AssetStatus.READY : AssetStatus.IN_USE;
    await this.prisma.kitTemplates.update({
      where: { id: templateId },
      data: { status: newStatus },
    });
    return newStatus;
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
