import { Controller, Get, Param } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { StatusSchema } from 'src/core/enums/asset-status.enum';
import { AssetStatus } from '@prisma/client';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('summary')
  getSummary() {
    return this.assetsService.getSummary();
  }

  @Get('/category/count')
  getAllAssetsCountByCategory() {
    return this.assetsService.getAsssetsCountByCategory('');
  }

  @Get('/status/:status')
  getAssetsByStatus(
    @Param('status', new ZodValidationPipe(StatusSchema)) status: AssetStatus,
  ) {
    return this.assetsService.getAssetsByStatus(status);
  }

  @Get('/category/:category')
  getAssetsByCategory(@Param('category') category: string) {
    return this.assetsService.getAsssetsByCategory(category);
  }

  @Get('/category/:category/count')
  getAssetsCountByCategory(@Param('category') category: string) {
    return this.assetsService.getAsssetsCountByCategory(category);
  }

  @Get('/')
  getAllAssets() {
    return this.assetsService.getAsssetsByCategory('');
  }
}
