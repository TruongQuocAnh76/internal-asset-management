import { Test, TestingModule } from '@nestjs/testing';
import { KitsService } from './kits.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetStatus } from '@prisma/client';

describe('KitsService', () => {
  let service: KitsService;

  const prismaMock = {
    assetsKits: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    assetItems: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    kitTemplates: {
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    kitTemplateItems: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    assets: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((fn) => fn(prismaMock)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KitsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(KitsService);

    jest.clearAllMocks();
  });

  // ── recomputeKitStatus ──────────────────────────────────────────────────────

  describe('recomputeKitStatus', () => {
    const kitId = 'kit-1';
    const templateId = 'template-1';

    beforeEach(() => {
      // Default: kit exists with template
      prismaMock.assetsKits.findUnique.mockResolvedValue({ status: AssetStatus.READY, template_id: templateId });
      prismaMock.assetsKits.update.mockResolvedValue({});
      prismaMock.assetsKits.count.mockResolvedValue(1);
      prismaMock.kitTemplates.update.mockResolvedValue({});
    });

    describe('currentStatus is null (lazy fetch)', () => {
      it('queries DB for current status when currentStatus is null', async () => {
        prismaMock.assetsKits.findUnique
          .mockResolvedValueOnce({ status: AssetStatus.IN_USE }) // status fetch
          .mockResolvedValueOnce({ template_id: templateId }); // template fetch

        await service.recomputeKitStatus(kitId, null, AssetStatus.MAINTAINANCE);

        expect(prismaMock.assetsKits.findUnique).toHaveBeenCalledWith({
          where: { id: kitId },
          select: { status: true },
        });
      });

      it('returns READY early when kit not found in DB', async () => {
        prismaMock.assetsKits.findUnique.mockResolvedValueOnce(null);

        const result = await service.recomputeKitStatus(kitId, null, AssetStatus.IN_USE);

        expect(prismaMock.assetsKits.update).not.toHaveBeenCalled();
        expect(result).toBe(AssetStatus.READY);
      });
    });

    describe('updateStatus provided (add/replace path)', () => {
      it('updates to updateStatus when it has higher priority than currStatus', async () => {
        // currStatus = IN_USE (index 3), updateStatus = BROKEN (index 1) → BROKEN wins
        prismaMock.assetsKits.findUnique
          .mockResolvedValueOnce({ status: AssetStatus.IN_USE })
          .mockResolvedValueOnce({ template_id: templateId });

        const result = await service.recomputeKitStatus(kitId, AssetStatus.IN_USE, AssetStatus.BROKEN);

        expect(prismaMock.assetsKits.update).toHaveBeenCalledWith({
          where: { id: kitId },
          data: { status: AssetStatus.BROKEN },
        });
        expect(result).toBe(AssetStatus.BROKEN);
      });

      it('keeps currStatus when it has higher priority than updateStatus', async () => {
        // currStatus = BROKEN (index 1), updateStatus = IN_USE (index 3) → BROKEN stays
        const result = await service.recomputeKitStatus(kitId, AssetStatus.BROKEN, AssetStatus.IN_USE);

        expect(prismaMock.assetsKits.update).not.toHaveBeenCalled();
        expect(result).toBe(AssetStatus.BROKEN);
      });

      it('keeps currStatus when priorities are equal', async () => {
        const result = await service.recomputeKitStatus(kitId, AssetStatus.IN_USE, AssetStatus.IN_USE);

        expect(prismaMock.assetsKits.update).not.toHaveBeenCalled();
        expect(result).toBe(AssetStatus.IN_USE);
      });

      it('updates LIQUIDATED over any other status', async () => {
        // currStatus = BROKEN (index 1), updateStatus = LIQUIDATED (index 0) → LIQUIDATED wins
        prismaMock.assetsKits.findUnique
          .mockResolvedValueOnce({ template_id: templateId });

        const result = await service.recomputeKitStatus(kitId, AssetStatus.BROKEN, AssetStatus.LIQUIDATED);

        expect(prismaMock.assetsKits.update).toHaveBeenCalledWith({
          where: { id: kitId },
          data: { status: AssetStatus.LIQUIDATED },
        });
        expect(result).toBe(AssetStatus.LIQUIDATED);
      });
    });

    describe('updateStatus is null (remove/recalculate path)', () => {
      beforeEach(() => {
        // second findUnique for template lookup
        prismaMock.assetsKits.findUnique
          .mockResolvedValueOnce({ status: AssetStatus.IN_USE }) // status query (when currentStatus is null)
          .mockResolvedValueOnce({ template_id: templateId }); // template query
      });

      it('sets to READY when all items are READY', async () => {
        prismaMock.assetItems.findMany.mockResolvedValue([
          { status: AssetStatus.READY },
          { status: AssetStatus.READY },
        ]);

        const result = await service.recomputeKitStatus(kitId, null, null);

        expect(prismaMock.assetsKits.update).toHaveBeenCalledWith({
          where: { id: kitId },
          data: { status: AssetStatus.READY },
        });
        expect(result).toBe(AssetStatus.READY);
      });

      it('picks highest priority status from items', async () => {
        prismaMock.assetItems.findMany.mockResolvedValue([
          { status: AssetStatus.READY },
          { status: AssetStatus.IN_USE },
          { status: AssetStatus.BROKEN },
        ]);

        const result = await service.recomputeKitStatus(kitId, null, null);

        expect(prismaMock.assetsKits.update).toHaveBeenCalledWith({
          where: { id: kitId },
          data: { status: AssetStatus.BROKEN },
        });
        expect(result).toBe(AssetStatus.BROKEN);
      });

      it('picks LIQUIDATED as highest priority when present', async () => {
        prismaMock.assetItems.findMany.mockResolvedValue([
          { status: AssetStatus.BROKEN },
          { status: AssetStatus.LIQUIDATED },
          { status: AssetStatus.MAINTAINANCE },
        ]);

        const result = await service.recomputeKitStatus(kitId, null, null);

        expect(result).toBe(AssetStatus.LIQUIDATED);
      });

      it('sets to READY when there are no items', async () => {
        prismaMock.assetItems.findMany.mockResolvedValue([]);

        const result = await service.recomputeKitStatus(kitId, null, null);

        expect(result).toBe(AssetStatus.READY);
      });

      it('does not update kit row when status is unchanged', async () => {
        // currStatus already IN_USE, items give IN_USE
        prismaMock.assetItems.findMany.mockResolvedValue([
          { status: AssetStatus.IN_USE },
          { status: AssetStatus.READY },
        ]);

        await service.recomputeKitStatus(kitId, AssetStatus.IN_USE, null);

        // The status stays IN_USE — no update call for the kit row
        expect(prismaMock.assetsKits.update).not.toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: kitId } }),
        );
      });
    });

    describe('template status recomputation', () => {
      it('sets template to READY when at least one kit is READY', async () => {
        prismaMock.assetsKits.update.mockResolvedValue({});
        prismaMock.assetsKits.findUnique.mockResolvedValueOnce({ template_id: templateId });
        prismaMock.assetsKits.count.mockResolvedValue(2); // readyKitCount > 0

        await service.recomputeKitStatus(kitId, AssetStatus.IN_USE, AssetStatus.READY);

        expect(prismaMock.kitTemplates.update).toHaveBeenCalledWith({
          where: { id: templateId },
          data: { status: AssetStatus.READY },
        });
      });

      it('sets template to IN_USE when no kits are READY', async () => {
        prismaMock.assetsKits.update.mockResolvedValue({});
        prismaMock.assetsKits.findUnique.mockResolvedValueOnce({ template_id: templateId });
        prismaMock.assetsKits.count.mockResolvedValue(0); // readyKitCount = 0

        await service.recomputeKitStatus(kitId, AssetStatus.READY, AssetStatus.IN_USE);

        expect(prismaMock.kitTemplates.update).toHaveBeenCalledWith({
          where: { id: templateId },
          data: { status: AssetStatus.IN_USE },
        });
      });

      it('skips template update when kit row not found for template lookup', async () => {
        const txMock: any = {
          assetsKits: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
          },
          kitTemplates: { update: jest.fn() },
          assetItems: { findMany: jest.fn() },
        };

        await service.recomputeKitStatus(kitId, AssetStatus.READY, AssetStatus.IN_USE, txMock);

        expect(txMock.kitTemplates.update).not.toHaveBeenCalled();
      });
    });

    describe('custom tx client', () => {
      it('uses provided tx client instead of prisma', async () => {
        const txMock: any = {
          assetsKits: {
            findUnique: jest.fn().mockResolvedValueOnce({ template_id: templateId }),
            update: jest.fn(),
            count: jest.fn().mockResolvedValue(1),
          },
          kitTemplates: {
            update: jest.fn(),
          },
          assetItems: { findMany: jest.fn() },
        };

        await service.recomputeKitStatus(kitId, AssetStatus.READY, AssetStatus.IN_USE, txMock);

        expect(txMock.assetsKits.update).toHaveBeenCalled();
        expect(prismaMock.assetsKits.update).not.toHaveBeenCalled();
      });
    });
  });
});
