import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import {
  GetAssetsParams,
  getAssetsParamsSchema,
} from './dto/get-assets-params.dto';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  getAllAssets(
    @Query(new ZodValidationPipe(getAssetsParamsSchema)) query: GetAssetsParams,
  ) {
    return this.assetsService.getAssets(query);
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

  @Get('/category/:category/count')
  @UseGuards(SessionAuthGuard)
  getAssetsCountByCategory(@Param('category') category: string) {
    return this.assetsService.getAsssetsCountByCategory(category);
  }
}
