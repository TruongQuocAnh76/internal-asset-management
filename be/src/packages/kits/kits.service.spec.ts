import { Test, TestingModule } from '@nestjs/testing';
import { ItemStatus, TemplateStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { KitsService } from './kits.service';

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
      updateMany: jest.fn(),
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

  describe('recomputeKitStatus', () => {
    const kitId = 'kit-1';

    describe('item status update (deletedItem = false)', () => {
      it('returns UNAVAILABLE when updated item is not READY', async () => {
        const result = await service.recomputeKitStatus(
          kitId,
          TemplateStatus.AVAILABLE,
          ItemStatus.IN_USE,
          false,
        );

        expect(result).toBe(TemplateStatus.UNAVAILABLE);
      });

      it('returns AVAILABLE when stale kit is AVAILABLE and updated item is READY', async () => {
        const result = await service.recomputeKitStatus(
          kitId,
          TemplateStatus.AVAILABLE,
          ItemStatus.READY,
          false,
        );

        expect(result).toBe(TemplateStatus.AVAILABLE);
      });

      it('returns AVAILABLE when stale kit is UNAVAILABLE and last not-READY item becomes READY', async () => {
        prismaMock.assetItems.count.mockResolvedValue(1);

        const result = await service.recomputeKitStatus(
          kitId,
          TemplateStatus.UNAVAILABLE,
          ItemStatus.READY,
          false,
        );

        expect(result).toBe(TemplateStatus.AVAILABLE);
      });

      it('returns UNAVAILABLE when stale kit is UNAVAILABLE and other not-READY items still exist', async () => {
        prismaMock.assetItems.count.mockResolvedValue(2);

        const result = await service.recomputeKitStatus(
          kitId,
          TemplateStatus.UNAVAILABLE,
          ItemStatus.READY,
          false,
        );

        expect(result).toBe(TemplateStatus.UNAVAILABLE);
      });
    });

    describe('item deletion (deletedItem = true)', () => {
      it('returns AVAILABLE when stale kit is AVAILABLE', async () => {
        const result = await service.recomputeKitStatus(
          kitId,
          TemplateStatus.AVAILABLE,
          ItemStatus.READY,
          true,
        );

        expect(result).toBe(TemplateStatus.AVAILABLE);
      });

      it('returns AVAILABLE when stale kit is UNAVAILABLE and deleted item was last not-READY item', async () => {
        prismaMock.assetItems.count.mockResolvedValue(1);

        const result = await service.recomputeKitStatus(
          kitId,
          TemplateStatus.UNAVAILABLE,
          ItemStatus.BROKEN,
          true,
        );

        expect(result).toBe(TemplateStatus.AVAILABLE);
      });

      it('returns UNAVAILABLE when stale kit is UNAVAILABLE and deleted item was READY', async () => {
        const result = await service.recomputeKitStatus(
          kitId,
          TemplateStatus.UNAVAILABLE,
          ItemStatus.READY,
          true,
        );

        expect(result).toBe(TemplateStatus.UNAVAILABLE);
      });

      it('returns UNAVAILABLE when stale kit is UNAVAILABLE and other not-READY items still exist', async () => {
        prismaMock.assetItems.count.mockResolvedValue(3);

        const result = await service.recomputeKitStatus(
          kitId,
          TemplateStatus.UNAVAILABLE,
          ItemStatus.MAINTAINANCE,
          true,
        );

        expect(result).toBe(TemplateStatus.UNAVAILABLE);
      });
    });
  });

  describe('refreshKitAndTemplateStatus', () => {
    const kitId = 'kit-1';
    const templateId = 'template-1';

    it('sets kit AVAILABLE when all kit items are READY and template AVAILABLE when at least one kit is AVAILABLE', async () => {
      prismaMock.assetItems.count.mockResolvedValueOnce(0);
      prismaMock.assetsKits.findUnique.mockResolvedValueOnce({
        template_id: templateId,
      });
      prismaMock.assetsKits.count.mockResolvedValueOnce(1);

      await service.refreshKitAndTemplateStatus(kitId);

      expect(prismaMock.assetsKits.update).toHaveBeenCalledWith({
        where: { id: kitId },
        data: { status: TemplateStatus.AVAILABLE },
      });
      expect(prismaMock.kitTemplates.update).toHaveBeenCalledWith({
        where: { id: templateId },
        data: { status: TemplateStatus.AVAILABLE },
      });
    });

    it('sets kit UNAVAILABLE when any kit item is not READY', async () => {
      prismaMock.assetItems.count.mockResolvedValueOnce(1);
      prismaMock.assetsKits.findUnique.mockResolvedValueOnce({
        template_id: templateId,
      });
      prismaMock.assetsKits.count.mockResolvedValueOnce(0);

      await service.refreshKitAndTemplateStatus(kitId);

      expect(prismaMock.assetsKits.update).toHaveBeenCalledWith({
        where: { id: kitId },
        data: { status: TemplateStatus.UNAVAILABLE },
      });
      expect(prismaMock.kitTemplates.update).toHaveBeenCalledWith({
        where: { id: templateId },
        data: { status: TemplateStatus.UNAVAILABLE },
      });
    });
  });
});
