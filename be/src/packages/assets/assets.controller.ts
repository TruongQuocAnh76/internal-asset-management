import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { StatusSchema } from 'src/core/enums/asset-status.enum';
import { AssetStatus } from '@prisma/client';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('/')
  @UseGuards(SessionAuthGuard)
  getAllAssets() {
    return this.assetsService.getAsssetsByCategory('');
  }

  @Get('summary')
  @UseGuards(SessionAuthGuard)
  getSummary() {
    return this.assetsService.getSummary();
  }

  @Get('/category/count')
  @UseGuards(SessionAuthGuard)
  getAllAssetsCountByCategory() {
    return this.assetsService.getAsssetsCountByCategory('');
  }

  @Get('/status/:status')
  @UseGuards(SessionAuthGuard)
  getAssetsByStatus(
    @Param('status', new ZodValidationPipe(StatusSchema)) status: AssetStatus,
  ) {
    return this.assetsService.getAssetsByStatus(status);
  }

  @Get('/category/:category')
  @UseGuards(SessionAuthGuard)
  getAssetsByCategory(@Param('category') category: string) {
    return this.assetsService.getAsssetsByCategory(category);
  }

  @Get('/category/:category/count')
  @UseGuards(SessionAuthGuard)
  getAssetsCountByCategory(@Param('category') category: string) {
    return this.assetsService.getAsssetsCountByCategory(category);
  }
}
